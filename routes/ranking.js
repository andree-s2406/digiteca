const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');

let cachedRanking = null;
let lastRankingFetch = 0;
const RANKING_CACHE_TTL_MS = 20 * 1000; // 20 segundos

// GET /api/ranking - Obtener Top 5 libros más abiertos / más buscados
router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    if (cachedRanking && (now - lastRankingFetch < RANKING_CACHE_TTL_MS)) {
      return res.json(cachedRanking);
    }

    const result = await query(
      `SELECT l.id AS libro_id, l.titulo, l.autor, l.emoji, l.portada_url, l.materia, l.tipo, l.anios,
              COUNT(e.id) AS veces_abierto
       FROM libros l
       LEFT JOIN estadisticas_eventos e ON e.referencia_id = l.id AND (e.tipo = 'libro_abierto' OR e.tipo = 'lectura')
       GROUP BY l.id, l.titulo, l.autor, l.emoji, l.portada_url, l.materia, l.tipo, l.anios
       ORDER BY veces_abierto DESC, l.id ASC
       LIMIT 5;`
    );

    const ranking = result.rows.map((row, index) => ({
      posicion: index + 1,
      libro_id: row.libro_id,
      titulo: row.titulo,
      autor: row.autor,
      emoji: row.emoji,
      portada_url: row.portada_url,
      materia: row.materia,
      tipo: row.tipo,
      anios: row.anios,
      veces_abierto: parseInt(row.veces_abierto, 10) || 0
    }));

    const ids = ranking.map(r => r.libro_id);
    cachedRanking = {
      ids: ids,
      ranking: ranking
    };
    lastRankingFetch = now;

    res.json(cachedRanking);
  } catch (err) {
    console.error('Error en GET /api/ranking:', err);
    if (cachedRanking) {
      return res.json(cachedRanking);
    }
    res.status(500).json({ error: 'Error al consultar ranking dinámico' });
  }
});

// PUT /api/ranking - Actualizar ranking manual si se desea
router.put('/', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'Se esperaba un array de IDs de libros' });
    }

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

    // Invalidar caché
    cachedRanking = null;
    lastRankingFetch = 0;

    res.json({ message: 'Ranking actualizado exitosamente', ids });
  } catch (err) {
    console.error('Error en PUT /api/ranking:', err);
    res.status(500).json({ error: 'Error al actualizar ranking' });
  }
});

module.exports = router;
