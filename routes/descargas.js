const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');
const { ADMIN_ROLES } = require('../middleware/auth');
const { mapLibroRow } = require('../services/librosService');

function assertOwnerOrAdmin(req, targetEmail) {
  if (!req.user) return false;
  if (ADMIN_ROLES.has((req.user.rol || '').toLowerCase())) return true;
  return String(req.user.email || '').toLowerCase() === String(targetEmail || '').toLowerCase().trim();
}

// GET /api/descargas - Listar libros guardados por usuario
router.get('/', async (req, res) => {
  try {
    const email = req.query.email || (req.user && req.user.email);
    if (!email) {
      return res.status(400).json({ error: 'Email de usuario requerido' });
    }
    if (!assertOwnerOrAdmin(req, email)) {
      return res.status(403).json({ error: 'No autorizado para consultar las lecturas de otro usuario' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const result = await query(
      `SELECT d.id AS descarga_id, d.fecha_guardado, l.*
       FROM descargas d
       JOIN libros l ON d.libro_id = l.id
       WHERE LOWER(d.usuario_email) = $1
       ORDER BY d.fecha_guardado DESC;`,
      [trimmedEmail]
    );

    const descargas = result.rows.map(row => ({
      ...mapLibroRow(row, true),
      descargaId: row.descarga_id,
      fechaGuardado: row.fecha_guardado
    }));

    res.json(descargas);
  } catch (err) {
    console.error('Error en GET /api/descargas:', err);
    res.status(500).json({ error: 'Error al consultar descargas' });
  }
});

// POST /api/descargas - Guardar libro
router.post('/', async (req, res) => {
  try {
    const email = (req.body && req.body.email) || (req.user && req.user.email);
    const { libroId } = req.body;
    if (!email || !libroId) {
      return res.status(400).json({ error: 'Email y libroId requeridos' });
    }
    if (!assertOwnerOrAdmin(req, email)) {
      return res.status(403).json({ error: 'No autorizado para modificar lecturas de otro usuario' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const idNum = parseInt(libroId, 10);

    // Evitar duplicados
    const existing = await query(
      `SELECT id FROM descargas WHERE LOWER(usuario_email) = $1 AND libro_id = $2`,
      [trimmedEmail, idNum]
    );

    if (existing.rows.length > 0) {
      return res.status(200).json({ message: 'El libro ya estaba guardado', id: existing.rows[0].id });
    }

    const result = await query(
      `INSERT INTO descargas (usuario_email, libro_id)
       VALUES ($1, $2)
       RETURNING *;`,
      [trimmedEmail, idNum]
    );

    res.status(201).json({ message: 'Libro guardado exitosamente', descarga: result.rows[0] });
  } catch (err) {
    console.error('Error en POST /api/descargas:', err);
    res.status(500).json({ error: 'Error al guardar libro' });
  }
});

// DELETE /api/descargas/:libroId - Quitar libro guardado
router.delete('/:libroId', async (req, res) => {
  try {
    const email = req.query.email || (req.user && req.user.email);
    const libroId = parseInt(req.params.libroId, 10);

    if (!email || isNaN(libroId)) {
      return res.status(400).json({ error: 'Email y libroId requeridos' });
    }
    if (!assertOwnerOrAdmin(req, email)) {
      return res.status(403).json({ error: 'No autorizado para eliminar lecturas de otro usuario' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    await query(
      `DELETE FROM descargas WHERE LOWER(usuario_email) = $1 AND libro_id = $2`,
      [trimmedEmail, libroId]
    );

    res.json({ message: 'Libro quitado de descargas' });
  } catch (err) {
    console.error('Error en DELETE /api/descargas/:libroId:', err);
    res.status(500).json({ error: 'Error al quitar libro' });
  }
});

// DELETE /api/descargas/limpiar/todo - Vaciar colección de un usuario
router.delete('/limpiar/todo', async (req, res) => {
  try {
    const email = req.query.email || (req.user && req.user.email);
    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }
    if (!assertOwnerOrAdmin(req, email)) {
      return res.status(403).json({ error: 'No autorizado para vaciar lecturas de otro usuario' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    await query(`DELETE FROM descargas WHERE LOWER(usuario_email) = $1`, [trimmedEmail]);

    res.json({ message: 'Todas las descargas han sido eliminadas' });
  } catch (err) {
    console.error('Error en DELETE /api/descargas/limpiar/todo:', err);
    res.status(500).json({ error: 'Error al vaciar descargas' });
  }
});

module.exports = router;
