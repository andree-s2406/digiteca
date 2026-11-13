const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');
const syncService = require('../services/sync');
const { hashPassword, verifyPassword } = require('../services/authService');

function mapUsuarioRow(r) {
  return {
    ...r,
    div: r.division || '',
    cursos_a_cargo: Array.isArray(r.cursos_a_cargo) ? r.cursos_a_cargo : [],
    restringido: r.restringido === true || r.estado === 'restringido'
  };
}

// GET /api/usuarios/me - Obtener el perfil actualizado del usuario autenticado
router.get('/me', async (req, res) => {
  try {
    const userEmail = (req.user && req.user.email) || req.headers['x-user-email'];
    if (!userEmail) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    const result = await query(
      `SELECT id::text AS id, email, nombre, apellido, rol, anio, division, cursos_a_cargo, estado, restringido, avatar, creado_en 
       FROM usuarios 
       WHERE LOWER(email) = $1 LIMIT 1;`,
      [userEmail.toLowerCase().trim()]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(mapUsuarioRow(result.rows[0]));
  } catch (err) {
    console.error('Error en GET /api/usuarios/me:', err);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// GET /api/usuarios - Listar todos los usuarios (para panel admin con ETag)
router.get('/', async (req, res) => {
  try {
    const currentVersion = syncService.getVersions().usuarios;
    const etag = `"usr-${currentVersion}"`;

    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('ETag', etag);

    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    const result = await query(
      `SELECT id::text AS id, email, nombre, apellido, rol, anio, division, cursos_a_cargo, estado, restringido, avatar, creado_en 
       FROM usuarios 
       ORDER BY id ASC;`
    );
    res.json(result.rows.map(mapUsuarioRow));
  } catch (err) {
    console.error('Error en GET /api/usuarios:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// POST /api/usuarios - Crear nuevo usuario
router.post('/', async (req, res) => {
  try {
    const { email, pwd, password, nombre, apellido, rol, anio, div, division, cursos_a_cargo, estado, restringido } = req.body;
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

    const finalEstado = restringido ? 'restringido' : (estado || 'activo');
    const finalRestringido = finalEstado === 'restringido' || restringido === true;
    const hashedPwd = hashPassword(finalPwd);

    const result = await query(
      `INSERT INTO usuarios (id, email, password, nombre, apellido, rol, anio, division, cursos_a_cargo, estado, restringido)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, email, nombre, apellido, rol, anio, division, cursos_a_cargo, estado, restringido, avatar, creado_en;`,
      [
        nextId,
        trimmedEmail,
        hashedPwd,
        nombre.trim(),
        apellido.trim(),
        rol || 'alumno',
        anio || 'Otro',
        div || division || '',
        JSON.stringify(Array.isArray(cursos_a_cargo) ? cursos_a_cargo : []),
        finalEstado,
        finalRestringido
      ]
    );

    const nuevoUsuario = mapUsuarioRow(result.rows[0]);
    syncService.notifyDataChange('usuarios', { action: 'create', id: nuevoUsuario.id, email: nuevoUsuario.email });
    res.status(201).json(nuevoUsuario);
  } catch (err) {
    console.error('Error en POST /api/usuarios:', err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// PUT /api/usuarios/perfil - Actualizar perfil propio (desde Mi Cuenta)
router.put('/perfil', async (req, res) => {
  try {
    const { email, nombre, apellido, anio, div, division, avatar, currentPwd, newPwd } = req.body;
    const targetEmail = ((req.user && req.user.email) || email || '').trim().toLowerCase();

    if (!targetEmail) {
      return res.status(400).json({ error: 'Email de usuario requerido' });
    }

    const userRes = await query(`SELECT * FROM usuarios WHERE LOWER(email) = $1`, [targetEmail]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userRes.rows[0];

    // Si se quiere cambiar la contraseña, validar la contraseña actual
    let finalPwd = user.password;
    if (newPwd) {
      const { valid } = verifyPassword(currentPwd, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'La contraseña actual ingresada es incorrecta' });
      }
      finalPwd = hashPassword(newPwd);
    }

    const nextDivision = div !== undefined ? div : (division !== undefined ? division : user.division);

    const result = await query(
      `UPDATE usuarios SET
         nombre = COALESCE($1, nombre),
         apellido = COALESCE($2, apellido),
         anio = COALESCE($3, anio),
         division = COALESCE($4, division),
         avatar = COALESCE($5, avatar),
         password = $6
       WHERE LOWER(email) = $7
       RETURNING id, email, nombre, apellido, rol, anio, division, cursos_a_cargo, estado, restringido, avatar;`,
      [
        nombre ? nombre.trim() : user.nombre,
        apellido ? apellido.trim() : user.apellido,
        anio || user.anio,
        nextDivision || '',
        avatar !== undefined ? avatar : user.avatar,
        finalPwd,
        targetEmail
      ]
    );

    const updatedUser = mapUsuarioRow(result.rows[0]);
    syncService.notifyDataChange('usuarios', { action: 'update-perfil', id: updatedUser.id, email: updatedUser.email });
    res.json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser
    });
  } catch (err) {
    console.error('Error en PUT /api/usuarios/perfil:', err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// PUT /api/usuarios/:id - Actualizar usuario desde panel admin
router.put('/:id', async (req, res) => {
  try {
    const rawId = String(req.params.id || '').trim();
    if (!rawId) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    const { email, pwd, password, nombre, apellido, rol, anio, div, division, cursos_a_cargo, estado, restringido } = req.body;
    const finalPwd = pwd || password;
    const hashedPwd = finalPwd ? hashPassword(finalPwd) : null;
    const nextDiv = div !== undefined ? div : (division !== undefined ? division : null);
    const nextCursos = Array.isArray(cursos_a_cargo) ? JSON.stringify(cursos_a_cargo) : null;
    const nextRestringido = restringido !== undefined ? Boolean(restringido) : (estado ? estado === 'restringido' : null);

    const result = await query(
      `UPDATE usuarios SET
         email = COALESCE($1, email),
         password = COALESCE($2, password),
         nombre = COALESCE($3, nombre),
         apellido = COALESCE($4, apellido),
         rol = COALESCE($5, rol),
         anio = COALESCE($6, anio),
         division = COALESCE($7, division),
         cursos_a_cargo = COALESCE($8, cursos_a_cargo),
         estado = COALESCE($9, estado),
         restringido = COALESCE($10, restringido)
       WHERE id::text = $11 OR LOWER(email) = LOWER($11)
       RETURNING id::text AS id, email, nombre, apellido, rol, anio, division, cursos_a_cargo, estado, restringido, avatar;`,
      [
        email ? email.trim().toLowerCase() : null,
        hashedPwd,
        nombre ? nombre.trim() : null,
        apellido ? apellido.trim() : null,
        rol || null,
        anio || null,
        nextDiv,
        nextCursos,
        estado || (nextRestringido === true ? 'restringido' : (nextRestringido === false ? 'activo' : null)),
        nextRestringido,
        rawId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updated = mapUsuarioRow(result.rows[0]);
    syncService.notifyDataChange('usuarios', { action: 'update', id: updated.id, email: updated.email });
    res.json(updated);
  } catch (err) {
    console.error('Error en PUT /api/usuarios/:id:', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// PATCH /api/usuarios/:id/estado - Cambiar estado (activo / restringido)
router.patch('/:id/estado', async (req, res) => {
  try {
    const rawId = String(req.params.id || '').trim();
    const { estado } = req.body;

    if (!estado || !['activo', 'restringido'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido (debe ser activo o restringido)' });
    }

    const result = await query(
      `UPDATE usuarios SET estado = $1, restringido = $2 WHERE id::text = $3 OR LOWER(email) = LOWER($3) RETURNING id::text AS id, email, estado, restringido;`,
      [estado, estado === 'restringido', rawId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const updated = result.rows[0];
    syncService.notifyDataChange('usuarios', { action: 'patch-estado', id: updated.id, email: updated.email, estado: updated.estado });
    res.json(updated);
  } catch (err) {
    console.error('Error en PATCH /api/usuarios/:id/estado:', err);
    res.status(500).json({ error: 'Error al cambiar estado de usuario' });
  }
});

// DELETE /api/usuarios/:id - Eliminar usuario
router.delete('/:id', async (req, res) => {
  try {
    const rawId = String(req.params.id || '').trim();
    if (!rawId) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    const result = await query(
      `DELETE FROM usuarios WHERE id::text = $1 OR LOWER(email) = LOWER($1) RETURNING id::text AS id;`,
      [rawId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const deletedId = result.rows[0].id;
    syncService.notifyDataChange('usuarios', { action: 'delete', id: deletedId });
    res.json({ message: 'Usuario eliminado exitosamente', id: deletedId });
  } catch (err) {
    console.error('Error en DELETE /api/usuarios/:id:', err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;
