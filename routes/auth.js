const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const result = await query(
      `SELECT id, email, password, nombre, apellido, rol, anio, estado, avatar 
       FROM usuarios 
       WHERE LOWER(email) = $1`,
      [trimmedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    // Verificación de contraseña simple (o hash si se utiliza)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (user.estado === 'restringido') {
      return res.status(403).json({ error: 'Tu cuenta se encuentra restringida. Contacta a tu preceptor/a.' });
    }

    // Registrar evento de login exitoso para métricas
    const diaSemana = new Date().getDay();
    await query(
      `INSERT INTO estadisticas_eventos (tipo, usuario_email, usuario_nombre, usuario_rol, dia_semana, anio_cursada)
       VALUES ('ingreso', $1, $2, $3, $4, $5)`,
      [user.email, `${user.nombre} ${user.apellido}`, user.rol, diaSemana, user.anio || 'Otro']
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: 'Inicio de sesión exitoso',
      user: userWithoutPassword
    });
  } catch (err) {
    console.error('Error en /api/auth/login:', err);
    res.status(500).json({ error: 'Error del servidor al procesar inicio de sesión' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const result = await query(`SELECT id, email FROM usuarios WHERE LOWER(email) = $1`, [trimmedEmail]);

    // Responder siempre positivamente por seguridad
    res.json({
      message: 'Si el correo está registrado, se enviaron las instrucciones para restablecer la contraseña.'
    });
  } catch (err) {
    console.error('Error en /api/auth/reset-password:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
