const crypto = require('crypto');
const config = require('../config');

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

function getAuthSecret() {
  if (config.authSecret && config.authSecret.trim().length >= 16) {
    return config.authSecret.trim();
  }
  const fallbackSeed = config.databaseUrl || 'digiteca-local-dev-secret-key';
  return crypto.createHash('sha256').update(fallbackSeed).digest('hex');
}

/**
 * Hashea una contraseña con scrypt y salt aleatorio de 16 bytes.
 * Formato: scrypt$<saltHex>$<hashHex>
 */
function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(plainPassword), salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

/**
 * Verifica una contraseña contra un hash scrypt o contra texto plano heredado.
 * Retorna { valid: boolean, needsRehash: boolean }.
 */
function verifyPassword(plainPassword, storedPassword) {
  if (!plainPassword || !storedPassword) {
    return { valid: false, needsRehash: false };
  }

  const stored = String(storedPassword);
  if (stored.startsWith('scrypt$')) {
    const parts = stored.split('$');
    if (parts.length !== 3) return { valid: false, needsRehash: false };
    const [, salt, hashHex] = parts;
    const derived = crypto.scryptSync(String(plainPassword), salt, 64);
    const expected = Buffer.from(hashHex, 'hex');
    if (derived.length !== expected.length) return { valid: false, needsRehash: false };
    return { valid: crypto.timingSafeEqual(derived, expected), needsRehash: false };
  }

  // Compatibilidad temporal con contraseñas heredadas en texto plano para migración automática
  const valid = stored === String(plainPassword);
  return { valid, needsRehash: valid };
}

/**
 * Genera un token firmado con HMAC-SHA256 (formato payloadB64.sigB64).
 */
function createSessionToken(user) {
  const now = Date.now();
  const payload = {
    id: user.id,
    email: String(user.email || '').toLowerCase().trim(),
    rol: String(user.rol || 'alumno').toLowerCase().trim(),
    iat: now,
    exp: now + TOKEN_TTL_MS
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sigB64 = crypto
    .createHmac('sha256', getAuthSecret())
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${sigB64}`;
}

/**
 * Verifica la firma y expiración de un token de sesión.
 * Retorna el payload decodificado o null si es inválido.
 */
function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getAuthSecret())
    .update(payloadB64)
    .digest('base64url');

  const sigBuf = Buffer.from(sigB64);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload || !payload.email || !payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch (_) {
    return null;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken
};
