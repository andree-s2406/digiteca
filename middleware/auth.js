const { verifySessionToken } = require('../services/authService');
const { ADMIN_ROLES } = require('../config/constants');

/**
 * Middleware de autenticación y control de acceso basado en roles (RBAC) para /api/*
 * Valida tokens firmados (Authorization: Bearer <token>) en rutas protegidas.
 */
function apiAuthGuard(req, res, next) {
  // 1. Métodos GET y HEAD públicos para catálogo, libros, ranking y salud
  if ((req.method === 'GET' || req.method === 'HEAD') && (
    req.path.startsWith('/libros') ||
    req.path.startsWith('/ranking') ||
    req.path === '/health'
  )) {
    return next();
  }

  // 2. Endpoints públicos de autenticación, contacto (POST), métricas de lectura y sync
  const publicExactOrPrefix = [
    '/auth/login',
    '/auth/reset-password',
    '/stats/visita',
    '/stats/lectura',
    '/stats/libro-abierto',
    '/sync',
    '/health'
  ];
  if (publicExactOrPrefix.some(p => req.path === p || req.path.startsWith(p))) {
    return next();
  }
  if (req.method === 'POST' && req.path === '/contacto') {
    return next();
  }

  // 3. Extraer y verificar token Bearer firmado
  const authHeader = req.headers['authorization'] || '';
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = bearerMatch ? bearerMatch[1].trim() : '';
  const sessionUser = verifySessionToken(token);

  if (!sessionUser) {
    return res.status(401).json({
      error: 'Sesión inválida o expirada. Por favor, volvé a iniciar sesión en DigiTeca.'
    });
  }

  req.user = sessionUser;
  const userRole = (sessionUser.rol || '').toLowerCase();
  const isAdmin = ADMIN_ROLES.has(userRole);

  // 4. Rutas de libros (POST, PUT, DELETE) y ranking (PUT) requieren permisos administrativos
  if (req.method !== 'GET' && (req.path.startsWith('/libros') || req.path.startsWith('/ranking')) && !isAdmin) {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  }

  // 5. Rutas administrativas restringidas (usuarios excepto perfil propio, stats admin, upload, contacto GET/PATCH)
  const adminEndpoints = ['/usuarios', '/stats', '/upload', '/contacto'];
  const isSelfProfile = req.path === '/usuarios/perfil' || req.path === '/usuarios/me';

  if (adminEndpoints.some(p => req.path.startsWith(p)) && !isAdmin && !isSelfProfile) {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  }

  next();
}

module.exports = {
  apiAuthGuard,
  ADMIN_ROLES
};
