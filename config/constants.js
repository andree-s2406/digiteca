/**
 * Constantes de negocio y configuración técnica compartidas en el backend.
 */

const ADMIN_ROLES = new Set(['admin', 'administrador', 'preceptor', 'profesor']);

const ALL_ROLES = new Set(['alumno', 'profesor', 'preceptor', 'admin', 'administrador']);

const EMOJIS_MATERIA = {
  'Matemática': '📐',
  'Física': '⚡',
  'Química': '⚗️',
  'Biología': '🧬',
  'Historia': '🏛️',
  'Geografía': '🌍',
  'Lengua y Literatura': '📖',
  'Inglés': '🗣️',
  'Informática': '💻',
  'Ciencias Naturales': '🔬',
  'Educación Sexual Integral (ESI)': '🌱',
  'Literatura Infantil / Cuentos': '📚',
  'Tecnología': '⚙️',
  'Robótica': '🤖',
  'Arte': '🎨',
  'Música': '🎵',
  'Filosofía': '🏛️',
  'Economía': '📈',
  'Derecho y Ciudadanía': '⚖️',
  'Cómics': '💬',
  'Historietas': '💬'
};

const UPLOAD_LIMITS = {
  PDF_MAX_BYTES: 50 * 1024 * 1024,      // 50 MB
  IMAGE_MAX_BYTES: 10 * 1024 * 1024     // 10 MB
};

const CACHE_TTLS = {
  STATS_MS: 20 * 1000,
  RANKING_MS: 20 * 1000,
  PDF_URL_CACHE_MAX: 500
};

const ALLOWED_HTML_PAGES = new Set([
  'index.html',
  'catalogo.html',
  'libro.html',
  'descargas.html',
  'login.html',
  'micuenta.html',
  'admin.html',
  'admin-mobile-preview.html'
]);

module.exports = {
  ADMIN_ROLES,
  ALL_ROLES,
  EMOJIS_MATERIA,
  UPLOAD_LIMITS,
  CACHE_TTLS,
  ALLOWED_HTML_PAGES
};
