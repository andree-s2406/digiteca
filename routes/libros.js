const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');
const {
  mapLibroRow,
  resolveLibroMetadata,
  getCachedPdfMeta,
  setCachedPdfMeta,
  invalidateLibrosCache
} = require('../services/librosService');
const { streamRemotePdf } = require('../services/pdfStreamService');

// GET /api/libros - Listar libros directamente desde CockroachDB
router.get('/', async (req, res) => {
  try {
    const { q, materia, anio, tipo } = req.query;

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

    res.json(libros);
  } catch (err) {
    console.error('Error en GET /api/libros (CockroachDB):', err);
    res.status(500).json({ error: 'Error al consultar libros en CockroachDB' });
  }
});

// GET /api/libros/:id - Detalle completo de un libro directamente desde CockroachDB
router.get('/:id', async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!rawId) {
      return res.status(400).json({ error: 'ID de libro inválido' });
    }

    const result = await query(`SELECT * FROM libros WHERE id::text = $1::text`, [String(rawId)]);
    if (result.rows.length > 0) {
      return res.json(mapLibroRow(result.rows[0], true));
    }

    return res.status(404).json({ error: 'Libro no encontrado en CockroachDB' });
  } catch (err) {
    console.error('Error en GET /api/libros/:id (CockroachDB):', err);
    res.status(500).json({ error: 'Error al consultar libro en la base de datos' });
  }
});

// GET /api/libros/:id/pdf - Streaming nativo directo desde GitHub Releases o Google Drive
router.get('/:id/pdf', async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!rawId) {
      return res.status(400).send('ID de libro inválido');
    }

    let cachedPdf = getCachedPdfMeta(rawId);
    if (!cachedPdf) {
      const result = await query(`SELECT pdf_url, titulo FROM libros WHERE id::text = $1::text`, [String(rawId)]);
      if (result.rows.length === 0 || !result.rows[0].pdf_url) {
        return res.status(404).send('PDF no disponible en la base de datos');
      }
      cachedPdf = {
        pdfUrl: result.rows[0].pdf_url.trim(),
        titulo: result.rows[0].titulo || 'libro'
      };
      setCachedPdfMeta(rawId, cachedPdf);
    }

    await streamRemotePdf(req, res, cachedPdf.pdfUrl, cachedPdf.titulo);
  } catch (err) {
    console.error('Error en /api/libros/:id/pdf:', err);
    res.status(500).send('Error interno al transmitir PDF');
  }
});

// ═══════════════════════════════════════════════════════════
// MUTACIONES (POST, PUT, DELETE)
// ═══════════════════════════════════════════════════════════
router.post('/', async (req, res) => {
  try {
    const { t, a, mat, tipo, anios, divisiones, img, pdf, e, c, l, x, subioPor } = req.body;

    if (!t || !a || !mat) {
      return res.status(400).json({ error: 'Título, autor y materia son obligatorios' });
    }

    const { emojiFinal, categoriaC, categoriaL } = resolveLibroMetadata(mat, e, c, l);

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

    invalidateLibrosCache('create', { id: result.rows[0].id });
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

    const { emojiFinal, categoriaC, categoriaL } = resolveLibroMetadata(mat, e, c, l);

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

    invalidateLibrosCache('update', { id: rawId });
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

    invalidateLibrosCache('delete', { id: rawId });
    res.json({ message: 'Libro eliminado exitosamente', id: result.rows[0].id });
  } catch (err) {
    console.error('Error en DELETE /api/libros/:id:', err);
    res.status(500).json({ error: 'Error al eliminar libro' });
  }
});

module.exports = router;
