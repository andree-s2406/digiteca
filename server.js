const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { seedDatabase } = require('./db/seed');

const authRoutes = require('./routes/auth');
const librosRoutes = require('./routes/libros');
const usuariosRoutes = require('./routes/usuarios');
const descargasRoutes = require('./routes/descargas');
const statsRoutes = require('./routes/stats');
const rankingRoutes = require('./routes/ranking');
const uploadRoutes = require('./routes/upload');
const contactoRoutes = require('./routes/contacto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname)));
app.use('/libros', express.static(path.join(__dirname, 'libros')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/favicon', express.static(path.join(__dirname, 'favicon')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Middleware de seguridad de autenticación para la API REST
function apiAuthGuard(req, res, next) {
  // 1. Métodos GET para catálogo, libros, ranking y salud son públicos
  if (req.method === 'GET' && (
    req.path.startsWith('/libros') ||
    req.path.startsWith('/ranking') ||
    req.path === '/health'
  )) {
    return next();
  }

  // 2. Endpoints públicos de autenticación, contacto y estadísticas
  const publicPaths = [
    '/auth/login',
    '/auth/reset-password',
    '/contacto',
    '/stats/visita',
    '/stats/lectura',
    '/stats/libro-abierto',
    '/health'
  ];
  if (publicPaths.some(p => req.path === p || req.path.startsWith(p))) {
    return next();
  }

  // 3. Para el resto de operaciones (crear/editar libros, panel usuarios, etc.) validar sesión
  const userEmail = req.headers['x-user-email'];
  if (!userEmail) {
    return res.status(401).json({ error: 'Acceso no autorizado. Debe iniciar sesión en DigiTeca.' });
  }

  // Rutas administrativas restringidas
  const adminEndpoints = ['/usuarios', '/stats', '/upload'];
  const userRole = (req.headers['x-user-rol'] || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'preceptor' || userRole === 'profesor';

  if (req.method !== 'GET' && req.path.startsWith('/libros') && !isAdmin) {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  }

  if (adminEndpoints.some(p => req.path.startsWith(p)) && !isAdmin) {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  }

  next();
}

app.use('/api', apiAuthGuard);

// Rutas de la API REST
app.use('/api/auth', authRoutes);
app.use('/api/libros', librosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/descargas', descargasRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contacto', contactoRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    database: 'CockroachDB',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no capturado:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor', detalle: err.message });
});

// Iniciar servidor y verificar conexión a CockroachDB
app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 Servidor DigiTeca iniciado en http://localhost:${PORT}`);
  console.log(`📚 Conectando con CockroachDB...`);
  console.log(`====================================================`);

  try {
    await seedDatabase();
    console.log(`✅ Base de datos CockroachDB lista y operativa.`);
  } catch (err) {
    console.warn(`⚠️ Advertencia al conectar con CockroachDB: ${err.message}`);
    console.warn(`💡 Verifica tu variable DATABASE_URL en el archivo .env`);
  }
});
