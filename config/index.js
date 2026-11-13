require('dotenv').config();

/**
 * Configuración centralizada de variables de entorno del servidor.
 */
const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  databaseUrl: process.env.DATABASE_URL || '',
  authSecret: process.env.AUTH_SECRET || '',
  debugSql: process.env.DEBUG_SQL === 'true',
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
    : null,
  pusher: {
    appId: process.env.PUSHER_APP_ID || '',
    key: process.env.PUSHER_KEY || '',
    secret: process.env.PUSHER_SECRET || '',
    cluster: process.env.PUSHER_CLUSTER || 'us2'
  },
  github: {
    token: process.env.GITHUB_TOKEN || '',
    owner: process.env.GITHUB_OWNER || 'andresrodriguez750-max',
    repo: process.env.GITHUB_REPO || 'digiteca-libros'
  }
};

module.exports = config;
