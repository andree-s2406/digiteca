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

const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Ocultar cabecera del servidor por seguridad
app.disable('x-powered-by');

// Compresión GZIP de alta velocidad para respuestas HTTP
app.use(compression({
  threshold: 1024
}));

// Cabeceras de seguridad HTTP
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate Limiter en memoria para prevenir fuerza bruta en el login
const loginAttempts = new Map();
function loginRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto
  const maxAttempts = 15;

  const userAttempts = loginAttempts.get(ip) || [];
  const recentAttempts = userAttempts.filter(t => now - t < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    return res.status(429).json({
      error: 'Demasiados intentos de acceso. Por favor, aguardá 1 minuto antes de reintentar.'
    });
  }

  recentAttempts.push(now);
  loginAttempts.set(ip, recentAttempts);

  if (loginAttempts.size > 2000) {
    loginAttempts.clear();
  }

  next();
}
app.use('/api/auth/login', loginRateLimiter);

// Servir archivos estáticos del frontend con caché controlada
const staticOptions = { maxAge: '1d', etag: true };

// Protección de enlace directo: Si el usuario intenta entrar directamente al link del PDF en la pestaña principal, redirigir al catálogo (NUNCA dentro de un iframe)
app.use('/libros', (req, res, next) => {
  const dest = req.headers['sec-fetch-dest'];
  if (dest === 'document' && req.path.toLowerCase().endsWith('.pdf')) {
    return res.redirect('/catalogo.html');
  }
  next();
});

app.use('/libros', express.static(path.join(__dirname, 'libros'), {
  maxAge: '1d',
  etag: true,
  setHeaders: (res) => {
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));
app.use('/img', express.static(path.join(__dirname, 'img'), staticOptions));
app.use('/favicon', express.static(path.join(__dirname, 'favicon'), staticOptions));
app.use('/css', express.static(path.join(__dirname, 'css'), { maxAge: 0, etag: true }));
app.use('/js', express.static(path.join(__dirname, 'js'), { maxAge: 0, etag: true }));
app.use(express.static(path.join(__dirname), { maxAge: 0, etag: true }));

// Middleware de seguridad de autenticación para la API REST
function apiAuthGuard(req, res, next) {
  // 1. Métodos GET y HEAD para catálogo, libros, ranking y salud son públicos
  if ((req.method === 'GET' || req.method === 'HEAD') && (
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
  const isAdmin = userRole === 'admin' || userRole === 'administrador' || userRole === 'preceptor' || userRole === 'profesor';

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
