/**
 * Envuelve handlers async de Express para delegar errores no capturados al middleware global.
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/**
 * Middleware global de manejo de errores HTTP.
 */
function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  if (status >= 500) {
    console.error('Error no capturado:', err.stack || err.message);
  }
  res.status(status).json({
    error: err.publicMessage || (status >= 500 ? 'Error interno del servidor' : err.message),
    ...(process.env.NODE_ENV !== 'production' && status >= 500 ? { detalle: err.message } : {})
  });
}

module.exports = {
  asyncHandler,
  errorHandler
};
