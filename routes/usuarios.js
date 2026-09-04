const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');

// GET /api/usuarios - Listar todos los usuarios (para panel admin)
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, password AS pwd, nombre, apellido, rol, anio, estado, avatar, creado_en 
       FROM usuarios 
       ORDER BY id ASC;`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error en GET /api/usuarios:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// POST /api/usuarios - Crear nuevo usuario
router.post('/', async (req, res) => {
  try {
    const { email, pwd, password, nombre, apellido, rol, anio, estado } = req.body;
    const finalPwd = pwd || password;

    if (!email || !finalPwd || !nombre || !apellido) {
      return res.status(400).json({ error: 'Email, contraseña, nombre y apellido son obligatorios' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Verificar si ya existe
    const exists = await query(`SELECT id FROM usuarios WHERE LOWER(email) = $1`, [trimmedEmail]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese correo electrónico' });
    }

        // Obtener siguiente ID seguro secuencial
    const maxRes = await query(`SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM usuarios WHERE id < 1000000000;`);
    let nextId = parseInt(maxRes.rows[0].next_id, 10);
    if (isNaN(nextId) || nextId < 1) nextId = 1;

    while (true) {
      const checkExists = await query(`SELECT 1 FROM usuarios WHERE id = $1;`, [nextId]);
      if (checkExists.rows.length === 0) break;
      nextId++;
    }

    const result = await query(
      `INSERT INTO usuarios (id, email, password, nombre, apellido, rol, anio, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, password AS pwd, nombre, apellido, rol, anio, estado, avatar, creado_en;`,
      [
        nextId,
        trimmedEmail,
        finalPwd,
        nombre.trim(),
        apellido.trim(),
        rol || 'alumno',
        anio || 'Otro',
        estado || 'activo'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error en POST /api/usuarios:', err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// PUT /api/usuarios/perfil - Actualizar perfil propio (desde Mi Cuenta)
router.put('/perfil', async (req, res) => {
  try {
    const { email, nombre, apellido, anio, avatar, currentPwd, newPwd } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email de usuario requerido' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const userRes = await query(`SELECT * FROM usuarios WHERE LOWER(email) = $1`, [trimmedEmail]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userRes.rows[0];

    // Si se quiere cambiar la contraseña, validar la contraseña actual
    let finalPwd = user.password;
    if (newPwd) {
      if (user.password !== currentPwd) {
        return res.status(401).json({ error: 'La contraseña actual ingresada es incorrecta' });
      }
      finalPwd = newPwd;
    }

    const result = await query(
      `UPDATE usuarios SET
         nombre = COALESCE($1, nombre),
         apellido = COALESCE($2, apellido),
         anio = COALESCE($3, anio),
         avatar = COALESCE($4, avatar),
         password = $5
       WHERE LOWER(email) = $6
       RETURNING id, email, password AS pwd, nombre, apellido, rol, anio, estado, avatar;`,
      [
        nombre ? nombre.trim() : user.nombre,
        apellido ? apellido.trim() : user.apellido,
        anio || user.anio,
        avatar || user.avatar,
        finalPwd,
        trimmedEmail
      ]
    );

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error en PUT /api/usuarios/perfil:', err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// PUT /api/usuarios/:id - Actualizar usuario desde panel admin
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    const { email, pwd, password, nombre, apellido, rol, anio, estado } = req.body;
    const finalPwd = pwd || password;

    const result = await query(
      `UPDATE usuarios SET
         email = COALESCE($1, email),
         password = COALESCE($2, password),
         nombre = COALESCE($3, nombre),
         apellido = COALESCE($4, apellido),
         rol = COALESCE($5, rol),
         anio = COALESCE($6, anio),
         estado = COALESCE($7, estado)
       WHERE id = $8
       RETURNING id, email, password AS pwd, nombre, apellido, rol, anio, estado, avatar;`,
      [
        email ? email.trim().toLowerCase() : null,
        finalPwd || null,
        nombre ? nombre.trim() : null,
        apellido ? apellido.trim() : null,
        rol || null,
        anio || null,
        estado || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en PUT /api/usuarios/:id:', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// PATCH /api/usuarios/:id/estado - Cambiar estado (activo / restringido)
router.patch('/:id/estado', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { estado } = req.body;

    if (!estado || !['activo', 'restringido'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido (debe ser activo o restringido)' });
    }

    const result = await query(
      `UPDATE usuarios SET estado = $1 WHERE id::text = $2::text RETURNING id, email, estado;`,
      [estado, String(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en PATCH /api/usuarios/:id/estado:', err);
    res.status(500).json({ error: 'Error al cambiar estado de usuario' });
  }
});

// DELETE /api/usuarios/:id - Eliminar usuario
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    const result = await query(`DELETE FROM usuarios WHERE id::text = $1::text RETURNING id;`, [String(id)]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado exitosamente', id });
  } catch (err) {
    console.error('Error en DELETE /api/usuarios/:id:', err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;
