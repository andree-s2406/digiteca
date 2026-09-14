const Pusher = require('pusher');

let pusher = null;

const appId = process.env.PUSHER_APP_ID;
const key = process.env.PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.PUSHER_CLUSTER || 'us2';

if (appId && key && secret) {
  try {
    pusher = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true
    });
    console.log(`[SyncService] Pusher inicializado correctamente (cluster: ${cluster}, appId: ${appId})`);
  } catch (err) {
    console.warn('[SyncService] Advertencia al configurar Pusher:', err.message);
  }
} else {
  console.warn('[SyncService] Pusher no configurado. Operando en modo polling/versión de respaldo.');
}

// Registro en memoria de versiones por módulo
const versions = {
  usuarios: Date.now(),
  libros: Date.now(),
  stats: Date.now(),
  ranking: Date.now()
};

/**
 * Notifica a todos los dispositivos que un módulo fue actualizado.
 * @param {'usuarios'|'libros'|'stats'|'ranking'} moduleName
 * @param {Object} payload Datos opcionales (id, acción, email, etc.)
 */
async function notifyDataChange(moduleName, payload = {}) {
  const newVersion = Date.now();
  versions[moduleName] = newVersion;

  const eventData = {
    module: moduleName,
    version: newVersion,
    timestamp: new Date().toISOString(),
    ...payload
  };

  if (pusher) {
    try {
      await pusher.trigger('digiteca-live', 'data-changed', eventData);
    } catch (err) {
      console.warn(`[SyncService] Error al emitir evento Pusher (${moduleName}):`, err.message);
    }
  }

  return newVersion;
}

function getVersions() {
  return { ...versions };
}

function getPublicConfig() {
  return {
    enabled: !!pusher,
    key: key || '',
    cluster: cluster || 'us2',
    channel: 'digiteca-live'
  };
}

module.exports = {
  notifyDataChange,
  getVersions,
  getPublicConfig
};
