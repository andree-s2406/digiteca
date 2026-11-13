const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { ALLOWED_HTML_PAGES } = require('./config/constants');
const { errorHandler } = require('./middleware/errorHandler');

const { seedDatabase } = require('./db/seed');

const authRoutes = require('./routes/auth');
const librosRoutes = require('./routes/libros');
const usuariosRoutes = require('./routes/usuarios');
const descargasRoutes = require('./routes/descargas');
const statsRoutes = require('./routes/stats');
const rankingRoutes = require('./routes/ranking');
const uploadRoutes = require('./routes/upload');
const contactoRoutes = require('./routes/contacto');
const syncRoutes = require('./routes/sync');

const compression = require('compression');

const app = express();
const PORT = config.port;

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

// Servir únicamente las vistas HTML públicas (evita exponer .env, package.json, routes/, db/, data/, scripts/)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/:page.html', (req, res, next) => {
  const filename = `${req.params.page}.html`;
  if (ALLOWED_HTML_PAGES.has(filename)) {
    return res.sendFile(path.join(__dirname, filename));
  }
  next();
});

const { apiAuthGuard } = require('./middleware/auth');

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
app.use('/api/sync', syncRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    database: 'CockroachDB',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores global
app.use(errorHandler);

// Red de seguridad global para evitar caídas del proceso
process.on('uncaughtException', (err) => {
  console.error('⚠️ [Servidor] Excepción no capturada:', err.message);
  if (err.stack) console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.warn('⚠️ [Servidor] Rechazo de promesa no gestionado:', reason);
});

// Iniciar servidor y verificar conexión a CockroachDB
const server = app.listen(PORT, async () => {
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

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [ERROR CRÍTICO] El puerto ${PORT} ya está en uso.`);
    console.error(`💡 Solución: Se cerrará esta instancia. Ejecuta iniciar_digiteca.bat para liberar el puerto automáticamente.\n`);
    process.exit(1);
  } else {
    console.error('❌ Error fatal en el servidor HTTP:', err);
    process.exit(1);
  }
});

// Cierre ordenado
function gracefulShutdown(signal) {
  console.log(`\n🛑 Recibido ${signal}. Cerrando conexiones...`);
  server.close(async () => {
    try {
      const { pool } = require('./db/connection');
      await pool.end();
      console.log('✅ Conexiones cerradas.');
    } catch (_) {}
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 3000).unref();
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
