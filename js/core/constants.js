/**
 * Constantes compartidas del frontend DigiTeca.
 */
(function (global) {
  const ADMIN_ROLES = ['admin', 'administrador', 'preceptor', 'profesor'];

  const STORAGE_KEYS = {
    SESION: 'digi-sesion',
    CUENTA: 'digi-cuenta',
    THEME: 'digi-theme',
    SWR_LIBROS: 'digi_swr_libros',
    STATS: 'digi-stats',
    LIBROS_DIVS: 'digi-libros-divs',
    ADMIN_USUARIOS: 'digi-admin-usuarios'
  };

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

  global.DIGI_CONSTANTS = {
    ADMIN_ROLES,
    STORAGE_KEYS,
    EMOJIS_MATERIA,
    isAdminRole: function (rol) {
      return ADMIN_ROLES.indexOf(String(rol || '').toLowerCase()) !== -1;
    }
  };
})(window);
