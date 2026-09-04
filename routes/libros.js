const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');

// Helper para convertir el formato de la BD al formato frontend esperado
function mapLibroRow(row) {
  return {
    id: row.id,
    t: row.titulo,
    a: row.autor,
    mat: row.materia,
    tipo: row.tipo || 'Libro',
    anios: Array.isArray(row.anios) ? row.anios : (typeof row.anios === 'string' ? JSON.parse(row.anios || '[]') : []),
    divisiones: Array.isArray(row.divisiones) ? row.divisiones : (typeof row.divisiones === 'string' ? JSON.parse(row.divisiones || '[]') : []),
    img: row.portada_url || '',
    pdf: row.pdf_url || '',
    e: row.emoji || '📚',
    c: row.categoria_c || 'ciencias',
    l: row.categoria_l || row.materia || 'Ciencias',
    x: row.descripcion || '',
    subioPor: row.subido_por || ''
  };
}

// GET /api/libros - Listar libros con filtros
router.get('/', async (req, res) => {
  try {
    const { q, materia, anio, tipo } = req.query;

    let sql = `SELECT * FROM libros WHERE 1=1`;
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
    let libros = result.rows.map(mapLibroRow);

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
    console.error('Error en GET /api/libros:', err);
    res.status(500).json({ error: 'Error al consultar libros' });
  }
});

// GET /api/libros/:id - Detalle de un libro
router.get('/:id', async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!rawId) {
      return res.status(400).json({ error: 'ID de libro inválido' });
    }

    const result = await query(`SELECT * FROM libros WHERE id::text = $1::text`, [String(rawId)]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }

    res.json(mapLibroRow(result.rows[0]));
  } catch (err) {
    console.error('Error en GET /api/libros/:id:', err);
    res.status(500).json({ error: 'Error al obtener libro' });
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
      "Inglés": "🗣️", "Informática": "💻", "Ciencias Naturales": "🔬"
    };

    const emojiFinal = e || EMOJIS[mat] || "📚";
    const categoriaC = c || mat.toLowerCase().replace(/[^a-z0-9]/g, '');
    const categoriaL = l || mat;

        // Obtener siguiente ID seguro secuencial
    const maxRes = await query(`SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM libros WHERE id < 1000000000;`);
    let nextId = parseInt(maxRes.rows[0].next_id, 10);
    if (isNaN(nextId) || nextId < 1) nextId = 1;

    // Verificar que no colisione
    while (true) {
      const checkExists = await query(`SELECT 1 FROM libros WHERE id = $1;`, [nextId]);
      if (checkExists.rows.length === 0) break;
      nextId++;
    }

    const result = await query(
      `INSERT INTO libros (id, titulo, autor, materia, tipo, anios, divisiones, portada_url, pdf_url, emoji, categoria_c, categoria_l, descripcion, subido_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *;`,
      [
        nextId,
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
      "Inglés": "🗣️", "Informática": "💻", "Ciencias Naturales": "🔬"
    };

    const emojiFinal = e || EMOJIS[mat] || "📚";
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

    res.json({ message: 'Libro eliminado exitosamente', id });
  } catch (err) {
    console.error('Error en DELETE /api/libros/:id:', err);
    res.status(500).json({ error: 'Error al eliminar libro' });
  }
});

module.exports = router;
