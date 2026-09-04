const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');

// GET /api/ranking - Obtener ranking de IDs
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT r.posicion, r.libro_id, l.titulo, l.autor, l.emoji, l.portada_url, l.materia
       FROM ranking_buscados r
       JOIN libros l ON r.libro_id = l.id
       ORDER BY r.posicion ASC;`
    );

    // Retornar array de IDs para compatibilidad directa y array enriquecido
    const ids = result.rows.map(r => r.libro_id);
    res.json({
      ids: ids,
      ranking: result.rows
    });
  } catch (err) {
    console.error('Error en GET /api/ranking:', err);
    res.status(500).json({ error: 'Error al consultar ranking' });
  }
});

// PUT /api/ranking - Actualizar ranking de IDs
router.put('/', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'Se esperaba un array de IDs de libros' });
    }

    // Limpiar tabla y reinsertar en orden
    await query(`DELETE FROM ranking_buscados;`);

    for (let i = 0; i < ids.length; i++) {
      const libroId = parseInt(ids[i], 10);
      if (!isNaN(libroId)) {
        await query(
          `INSERT INTO ranking_buscados (posicion, libro_id) VALUES ($1, $2);`,
          [i + 1, libroId]
        );
      }
    }

    res.json({ message: 'Ranking actualizado exitosamente', ids });
  } catch (err) {
    console.error('Error en PUT /api/ranking:', err);
    res.status(500).json({ error: 'Error al actualizar ranking' });
  }
});

module.exports = router;
