const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');

// POST /api/contacto - Enviar mensaje de contacto
router.post('/', async (req, res) => {
  try {
    const { nombre, email, rol, asunto, mensaje } = req.body;

    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ error: 'Nombre, email y mensaje son requeridos' });
    }

    const result = await query(
      `INSERT INTO mensajes_contacto (nombre, email, rol, asunto, mensaje)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [nombre.trim(), email.trim().toLowerCase(), rol || 'alumno', asunto || '', mensaje.trim()]
    );

    res.status(201).json({
      message: 'Mensaje enviado correctamente',
      mensaje: result.rows[0]
    });
  } catch (err) {
    console.error('Error en POST /api/contacto:', err);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

// GET /api/contacto - Listar mensajes de contacto (panel admin)
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM mensajes_contacto ORDER BY fecha DESC;`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error en GET /api/contacto:', err);
    res.status(500).json({ error: 'Error al consultar mensajes' });
  }
});

// PATCH /api/contacto/:id/leido - Marcar mensaje como leído
router.patch('/:id/leido', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { leido = true } = req.body;

    const result = await query(
      `UPDATE mensajes_contacto SET leido = $1 WHERE id = $2 RETURNING *;`,
      [leido, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en PATCH /api/contacto/:id/leido:', err);
    res.status(500).json({ error: 'Error al actualizar mensaje' });
  }
});

module.exports = router;
