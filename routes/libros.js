const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');
const fs = require('fs');
const path = require('path');
const syncService = require('../services/sync');

const DATA_DIR = path.join(__dirname, '..', 'data');
const LIBROS_JSON = path.join(DATA_DIR, 'libros.json');
const PDF_CACHE_DIR = path.join(DATA_DIR, 'pdf_cache');
if (!fs.existsSync(PDF_CACHE_DIR)) {
  try { fs.mkdirSync(PDF_CACHE_DIR, { recursive: true }); } catch (_) {}
}

const bookDetailCache = new Map();
const pdfBufferCache = new Map(); // id -> { buffer, title, length, time }
const PDF_CACHE_MAX_ENTRIES = 8;
let cachedLibros = loadLocalBackup();
let lastCacheTime = cachedLibros ? Date.now() : 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos en RAM

function saveLocalBackup(libros) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(LIBROS_JSON, JSON.stringify(libros, null, 2), 'utf8');
  } catch(e) {}
}

function loadLocalBackup() {
  try {
    if (fs.existsSync(LIBROS_JSON)) {
      return JSON.parse(fs.readFileSync(LIBROS_JSON, 'utf8'));
    }
  } catch(e) {}
  return null;
}

function invalidateCache(action = 'update', payload = {}) {
  cachedLibros = null;
  lastCacheTime = 0;
  bookDetailCache.clear();
  pdfBufferCache.clear();
  syncService.notifyDataChange('libros', { action, ...payload });
}

// Helper para convertir el formato de la BD al formato frontend esperado
function mapLibroRow(row, isDetail = false) {
  let pdfVal = row.pdf_url || '';
  if (!isDetail && typeof pdfVal === 'string' && pdfVal.startsWith('data:') && pdfVal.length > 256) {
    pdfVal = 'archivo:cargado';
  }

  let portadaVal = row.portada_url || '';
  if (typeof portadaVal === 'string' && (portadaVal.startsWith('file:') || portadaVal.includes('test.jpg'))) {
    portadaVal = 'img/test.jpg';
  }

  return {
    id: row.id,
    t: row.titulo,
    titulo: row.titulo,
    a: row.autor,
    autor: row.autor,
    mat: row.materia,
    materia: row.materia,
    tipo: row.tipo || 'Libro',
    anios: Array.isArray(row.anios) ? row.anios : (typeof row.anios === 'string' ? JSON.parse(row.anios || '[]') : []),
    divisiones: Array.isArray(row.divisiones) ? row.divisiones : (typeof row.divisiones === 'string' ? JSON.parse(row.divisiones || '[]') : []),
    img: portadaVal,
    portada_url: portadaVal,
    pdf: pdfVal,
    pdf_url: pdfVal,
    hasPdf: !!(row.pdf_url && row.pdf_url.length > 0) || row.tiene_pdf === true,
    e: row.emoji || '📚',
    emoji: row.emoji || '📚',
    c: row.categoria_c || 'ciencias',
    categoria_c: row.categoria_c || 'ciencias',
    l: row.categoria_l || row.materia || 'Ciencias',
    categoria_l: row.categoria_l || row.materia || 'Ciencias',
    x: row.descripcion || '',
    descripcion: row.descripcion || '',
    subioPor: row.subido_por || '',
    subido_por: row.subido_por || ''
  };
}

// GET /api/libros - Listar libros con filtros (Optimizado para alta velocidad y bajo consumo de red)
router.get('/', async (req, res) => {
  try {
    const { q, materia, anio, tipo } = req.query;
    const isGeneralList = !q && !materia && !anio && !tipo;
    const now = Date.now();

    // Cache hit instantáneo con soporte ETag
    if (isGeneralList) {
      const currentVersion = syncService.getVersions().libros;
      const etag = `"lib-${currentVersion}"`;
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('ETag', etag);
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }
      if (cachedLibros && (now - lastCacheTime < CACHE_TTL_MS)) {
        return res.json(cachedLibros);
      }
    }

    let sql = `
      SELECT 
        id, titulo, autor, materia, tipo, anios, divisiones, portada_url,
        (CASE WHEN pdf_url IS NOT NULL AND LENGTH(pdf_url) > 0 THEN true ELSE false END) AS tiene_pdf,
        (CASE WHEN pdf_url LIKE 'data:%' THEN 'archivo:cargado' ELSE pdf_url END) AS pdf_url,
        emoji, categoria_c, categoria_l, descripcion, subido_por
      FROM libros 
      WHERE 1=1`;
    const params = [];

    if (materia) {
      params.push(materia);
      sql += ` AND LOWER(materia) = LOWER($${params.length})`;
    }

    if (tipo) {
      params.push(tipo);
      sql += ` AND LOWER(tipo) = LOWER($${params.length})`;
    }

    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      const pIdx = params.length;
      sql += ` AND (LOWER(titulo) LIKE $${pIdx} OR LOWER(autor) LIKE $${pIdx} OR LOWER(materia) LIKE $${pIdx} OR LOWER(descripcion) LIKE $${pIdx})`;
    }

    sql += ` ORDER BY id ASC`;

    const result = await query(sql, params);
    let libros = result.rows.map(r => mapLibroRow(r, false));

    // Filtrar por año si se especificó
    if (anio) {
      if (anio === 'otros') {
        libros = libros.filter(l => !l.anios || l.anios.length === 0);
      } else {
        const anioNum = parseInt(anio, 10);
        if (!isNaN(anioNum)) {
          libros = libros.filter(l => l.anios && l.anios.includes(anioNum));
        }
      }
    }

    if (isGeneralList) {
      cachedLibros = libros;
      lastCacheTime = now;
      saveLocalBackup(libros);
    }

    res.json(libros);
  } catch (err) {
    console.error('Error en GET /api/libros:', err);
    const backup = cachedLibros || loadLocalBackup();
    if (backup) {
      return res.json(backup);
    }
    res.status(500).json({ error: 'Error al consultar libros' });
  }
});
const DETAIL_TTL_MS = 60 * 1000; // 60 segundos

// GET /api/libros/:id - Detalle completo de un libro
router.get('/:id', async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!rawId) {
      return res.status(400).json({ error: 'ID de libro inválido' });
    }

    const now = Date.now();
    const cached = bookDetailCache.get(String(rawId));
    if (cached && (now - cached.time < DETAIL_TTL_MS)) {
      return res.json(cached.data);
    }

    try {
      const result = await query(`SELECT * FROM libros WHERE id::text = $1::text`, [String(rawId)]);
      if (result.rows.length > 0) {
        const mapped = mapLibroRow(result.rows[0], true);
        bookDetailCache.set(String(rawId), { data: mapped, time: now });
        return res.json(mapped);
      }
    } catch(dbErr) {
      console.warn('DB query en /api/libros/:id falló, recurriendo a backup local:', dbErr.message);
    }

    // Fallback a backup local en memoria o archivo data/libros.json
    const backup = cachedLibros || loadLocalBackup() || [];
    const localFound = backup.find(b => String(b.id) === String(rawId));
    if (localFound) {
      const mapped = mapLibroRow(localFound, true);
      bookDetailCache.set(String(rawId), { data: mapped, time: now });
      return res.json(mapped);
    }

    return res.status(404).json({ error: 'Libro no encontrado' });
  } catch (err) {
    console.error('Error en GET /api/libros/:id:', err);
    const backup = cachedLibros || loadLocalBackup() || [];
    const localFound = backup.find(b => String(b.id) === String(req.params.id));
    if (localFound) {
      return res.json(mapLibroRow(localFound, true));
    }
    res.status(500).json({ error: 'Error al obtener libro' });
  }
});

// GET /api/libros/:id/pdf - Transmisión en streaming de PDF con soporte CORS nativo, caché en disco y RAM
router.get('/:id/pdf', async (req, res) => {
  try {
    const rawId = req.params.id;
    const cacheKey = String(rawId);
    const now = Date.now();

    // 1. Inmunidad a Cold Starts: Obtener título y metadatos localmente en 0 ms
    const localList = cachedLibros || loadLocalBackup() || [];
    const localBook = localList.find(b => String(b.id) === cacheKey);

    let pdfUrl = localBook ? (localBook.pdf_url || localBook.pdf) : null;
    let titulo = localBook ? (localBook.titulo || localBook.t || 'libro') : 'libro';

    // 2. Caché persistente en disco (1 ms) con soporte nativo de Range requests y streaming
    const diskPdfPath = path.join(PDF_CACHE_DIR, `libro_${cacheKey}.pdf`);
    if (fs.existsSync(diskPdfPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(titulo)}.pdf"`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Accept-Ranges', 'bytes');
      return res.sendFile(diskPdfPath, { acceptRanges: true });
    }

    // 3. Cache hit en RAM (0 ms) si aún está en memoria
    const cached = pdfBufferCache.get(cacheKey);
    if (cached && (now - cached.time < 30 * 60 * 1000)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(cached.title || titulo)}.pdf"`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Accept-Ranges', 'bytes');

      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : cached.buffer.length - 1;
        if (!isNaN(start) && start < cached.buffer.length) {
          const validEnd = Math.min(isNaN(end) ? cached.buffer.length - 1 : end, cached.buffer.length - 1);
          const chunksize = (validEnd - start) + 1;
          res.status(206);
          res.setHeader('Content-Range', `bytes ${start}-${validEnd}/${cached.buffer.length}`);
          res.setHeader('Content-Length', chunksize);
          return res.end(cached.buffer.slice(start, validEnd + 1));
        }
      }

      if (cached.length) res.setHeader('Content-Length', cached.length);
      return res.send(cached.buffer);
    }

    // 4. Si el libro no estaba en el backup local, consultar la BD con fallback seguro
    if (!pdfUrl) {
      try {
        const result = await query(`SELECT pdf_url, titulo FROM libros WHERE id::text = $1::text`, [cacheKey]);
        if (result.rows.length > 0 && result.rows[0].pdf_url) {
          pdfUrl = result.rows[0].pdf_url;
          titulo = result.rows[0].titulo || 'libro';
        }
      } catch (dbErr) {
        console.warn(`[PDF Stream] DB query falló para libro ${cacheKey}:`, dbErr.message);
      }
    }

    if (!pdfUrl) {
      return res.status(404).send('PDF no disponible');
    }

    // 5. Si es un archivo local relativo en el servidor
    if (!pdfUrl.startsWith('http://') && !pdfUrl.startsWith('https://')) {
      const localPath = path.join(__dirname, '..', pdfUrl.replace(/^\//, ''));
      if (fs.existsSync(localPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(titulo)}.pdf"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.sendFile(localPath, { acceptRanges: true });
      }
      return res.status(404).send('Archivo local no encontrado');
    }

    // 6. Transmisión desde URL remota (GitHub Releases, Drive, etc.)
    let downloadUrl = pdfUrl;
    if (pdfUrl.includes('drive.google.com')) {
      const driveMatch = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || pdfUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (driveMatch && driveMatch[1]) {
        downloadUrl = `https://drive.usercontent.google.com/download?id=${driveMatch[1]}&export=download&confirm=t`;
      }
    }

    const fetchHeaders = {};
    if (req.headers.range) {
      fetchHeaders['Range'] = req.headers.range;
    }

    let upstream;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 35000);
      upstream = await fetch(downloadUrl, { headers: fetchHeaders, redirect: 'follow', signal: controller.signal });
      clearTimeout(timer);
    } catch (fetchErr) {
      console.warn(`[PDF Stream] Timeout o fallo en fetch a ${downloadUrl}:`, fetchErr.message);
      return res.status(504).send('Tiempo de espera agotado al conectar con el servidor del libro');
    }

    if (!upstream.ok && downloadUrl !== pdfUrl) {
      const driveMatch = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || pdfUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (driveMatch && driveMatch[1]) {
        try {
          upstream = await fetch(`https://drive.google.com/uc?export=download&id=${driveMatch[1]}`, { headers: fetchHeaders, redirect: 'follow' });
        } catch(e){}
      }
    }
    if (!upstream || !upstream.ok) {
      return res.status(upstream ? upstream.status : 502).send('No se pudo obtener el PDF del servidor remoto');
    }

    if (upstream.status === 206) {
      res.status(206);
      const cr = upstream.headers.get('content-range');
      if (cr) res.setHeader('Content-Range', cr);
      res.setHeader('Accept-Ranges', 'bytes');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(titulo)}.pdf"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const contentLength = upstream.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    const { Readable } = require('stream');
    if (upstream.body && typeof Readable.fromWeb === 'function') {
      const nodeStream = Readable.fromWeb(upstream.body);
      const chunks = [];
      let totalSize = 0;

      // Pipe directo al cliente de forma reactiva e inmediata
      nodeStream.pipe(res);

      // Guardar en búfer y en disco simultáneamente de fondo
      const tempDiskPath = path.join(PDF_CACHE_DIR, `libro_${cacheKey}.tmp`);
      let diskWriteStream = null;
      try {
        diskWriteStream = fs.createWriteStream(tempDiskPath);
      } catch (e) {}

      nodeStream.on('data', chunk => {
        if (diskWriteStream) diskWriteStream.write(chunk);
        if (totalSize < 50 * 1024 * 1024) {
          chunks.push(chunk);
          totalSize += chunk.length;
        }
      });

      nodeStream.on('end', () => {
        if (diskWriteStream) {
          diskWriteStream.end(() => {
            fs.rename(tempDiskPath, diskPdfPath, () => {});
          });
        }
        if (chunks.length > 0 && totalSize < 50 * 1024 * 1024) {
          try {
            const fullBuf = Buffer.concat(chunks);
            if (pdfBufferCache.size >= PDF_CACHE_MAX_ENTRIES) {
              const oldestKey = pdfBufferCache.keys().next().value;
              pdfBufferCache.delete(oldestKey);
            }
            pdfBufferCache.set(cacheKey, {
              buffer: fullBuf,
              title: titulo,
              length: contentLength || fullBuf.length,
              time: Date.now()
            });
          } catch(e){}
        }
      });

      nodeStream.on('error', (err) => {
        console.warn(`[PDF Stream] Error en stream de libro ${cacheKey}:`, err.message);
        if (diskWriteStream) {
          try { diskWriteStream.destroy(); fs.unlinkSync(tempDiskPath); } catch (_) {}
        }
      });

      return;
    }

    const arrayBuf = await upstream.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    try {
      fs.writeFileSync(diskPdfPath, buf);
    } catch (_) {}
    return res.send(buf);
  } catch (err) {
    console.error('Error al transmitir PDF:', err);
    res.status(500).send('Error interno al cargar el PDF');
  }
});

// POST /api/libros - Crear libro
router.post('/', async (req, res) => {
  try {
    const { t, a, mat, tipo, anios, divisiones, img, pdf, e, c, l, x, subioPor } = req.body;

    if (!t || !a || !mat) {
      return res.status(400).json({ error: 'Título, autor y materia son obligatorios' });
    }

    const EMOJIS = {
      "Matemática": "📐", "Física": "⚡", "Química": "⚗️", "Biología": "🧬",
      "Historia": "🏛️", "Geografía": "🌍", "Lengua y Literatura": "📖",
      "Inglés": "🗣️", "Informática": "💻", "Ciencias Naturales": "🔬",
      "Educación Sexual Integral (ESI)": "🌱", "Literatura Infantil / Cuentos": "📚",
      "Tecnología": "⚙️", "Robótica": "🤖", "Arte": "🎨", "Música": "🎵",
      "Filosofía": "🏛️", "Economía": "📈", "Derecho y Ciudadanía": "⚖️",
      "Historietas": ""
    };

    const emojiFinal = e !== undefined ? e : (EMOJIS[mat] || "");
    const categoriaC = c || mat.toLowerCase().replace(/[^a-z0-9]/g, '');
    const categoriaL = l || mat;

    let result;
    if (req.body.id && !isNaN(parseInt(req.body.id, 10))) {
      result = await query(
        `INSERT INTO libros (id, titulo, autor, materia, tipo, anios, divisiones, portada_url, pdf_url, emoji, categoria_c, categoria_l, descripcion, subido_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET
           titulo = EXCLUDED.titulo,
           autor = EXCLUDED.autor,
           materia = EXCLUDED.materia,
           portada_url = EXCLUDED.portada_url,
           pdf_url = EXCLUDED.pdf_url
         RETURNING *;`,
        [
          parseInt(req.body.id, 10),
          t.trim(),
          a.trim(),
          mat.trim(),
          tipo || 'Libro',
          JSON.stringify(anios || []),
          JSON.stringify(divisiones || []),
          img || '',
          pdf || '',
          emojiFinal,
          categoriaC,
          categoriaL,
          x || '',
          subioPor || 'admin'
        ]
      );
    } else {
      result = await query(
        `INSERT INTO libros (titulo, autor, materia, tipo, anios, divisiones, portada_url, pdf_url, emoji, categoria_c, categoria_l, descripcion, subido_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *;`,
        [
          t.trim(),
          a.trim(),
          mat.trim(),
          tipo || 'Libro',
          JSON.stringify(anios || []),
          JSON.stringify(divisiones || []),
          img || '',
          pdf || '',
          emojiFinal,
          categoriaC,
          categoriaL,
          x || '',
          subioPor || 'admin'
        ]
      );
    }

    invalidateCache('create', { id: result.rows[0].id });
    res.status(201).json(mapLibroRow(result.rows[0]));
  } catch (err) {
    console.error('Error en POST /api/libros:', err);
    res.status(500).json({ error: 'Error al agregar libro' });
  }
});

// PUT /api/libros/:id - Actualizar libro
router.put('/:id', async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!rawId) {
      return res.status(400).json({ error: 'ID de libro inválido' });
    }

    const { t, a, mat, tipo, anios, divisiones, img, pdf, e, c, l, x } = req.body;

    if (!t || !a || !mat) {
      return res.status(400).json({ error: 'Título, autor y materia son obligatorios' });
    }

    const EMOJIS = {
      "Matemática": "📐", "Física": "⚡", "Química": "⚗️", "Biología": "🧬",
      "Historia": "🏛️", "Geografía": "🌍", "Lengua y Literatura": "📖",
      "Inglés": "🗣️", "Informática": "💻", "Ciencias Naturales": "🔬",
      "Educación Sexual Integral (ESI)": "🌱", "Literatura Infantil / Cuentos": "📚",
      "Tecnología": "⚙️", "Robótica": "🤖", "Arte": "🎨", "Música": "🎵",
      "Filosofía": "🏛️", "Economía": "📈", "Derecho y Ciudadanía": "⚖️",
      "Historietas": ""
    };

    const emojiFinal = e !== undefined ? e : (EMOJIS[mat] || "");
    const categoriaC = c || mat.toLowerCase().replace(/[^a-z0-9]/g, '');
    const categoriaL = l || mat;

    const result = await query(
      `UPDATE libros SET
         titulo = $1,
         autor = $2,
         materia = $3,
         tipo = $4,
         anios = $5,
         divisiones = $6,
         portada_url = $7,
         pdf_url = $8,
         emoji = $9,
         categoria_c = $10,
         categoria_l = $11,
         descripcion = $12
       WHERE id::text = $13::text
       RETURNING *;`,
      [
        t.trim(),
        a.trim(),
        mat.trim(),
        tipo || 'Libro',
        JSON.stringify(anios || []),
        JSON.stringify(divisiones || []),
        img || '',
        pdf || '',
        emojiFinal,
        categoriaC,
        categoriaL,
        x || '',
        String(rawId)
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }

    invalidateCache('update', { id: rawId });
    res.json(mapLibroRow(result.rows[0]));
  } catch (err) {
    console.error('Error en PUT /api/libros/:id:', err);
    res.status(500).json({ error: 'Error al actualizar libro' });
  }
});

// DELETE /api/libros/:id - Eliminar libro
router.delete('/:id', async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!rawId) {
      return res.status(400).json({ error: 'ID de libro inválido' });
    }

    const result = await query(`DELETE FROM libros WHERE id::text = $1::text RETURNING id;`, [String(rawId)]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }

    invalidateCache('delete', { id: rawId });
    res.json({ message: 'Libro eliminado exitosamente', id: result.rows[0].id });
  } catch (err) {
    console.error('Error en DELETE /api/libros/:id:', err);
    res.status(500).json({ error: 'Error al eliminar libro' });
  }
});

module.exports = router;
