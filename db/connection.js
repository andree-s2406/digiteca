const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://root@localhost:26257/digiteca?sslmode=disable';

// Detectar si la URL requiere SSL (por ejemplo CockroachDB Cloud)
const isCloud = connectionString.includes('cockroachlabs.cloud') || 
                connectionString.includes('sslmode=verify-full') || 
                connectionString.includes('sslmode=require');

// Buscar certificado root.crt si existe en APPDATA (Windows) o HOME (Linux/Mac)
let sslConfig = false;
let cleanConnectionString = connectionString;

if (isCloud) {
  const appData = process.env.APPDATA || '';
  const homeDir = process.env.USERPROFILE || process.env.HOME || '';
  const possibleCertPaths = [
    path.join(appData, 'postgresql', 'root.crt'),
    path.join(homeDir, '.postgresql', 'root.crt'),
    path.join(__dirname, '..', 'root.crt')
  ];

  let certFound = null;
  for (const certPath of possibleCertPaths) {
    if (certPath && fs.existsSync(certPath)) {
      certFound = fs.readFileSync(certPath).toString();
      break;
    }
  }

  sslConfig = certFound ? { ca: certFound, rejectUnauthorized: true } : { rejectUnauthorized: false };
  // Remover el parámetro sslmode de la URL para que no entre en conflicto con el objeto ssl
  cleanConnectionString = cleanConnectionString
    .replace(/([?&])sslmode=[^&]+(&|$)/, '$1')
    .replace(/\?$/, '');
}

const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // 30s para absorber el arranque en frío (cold start) de CockroachDB Serverless
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Error imprevisto en el pool de CockroachDB:', err.message);
});

async function query(text, params, retries = 2) {
  const start = Date.now();
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      if (process.env.DEBUG_SQL) {
        console.log('Query ejecutada:', { text, duration, rows: res.rowCount });
      }
      return res;
    } catch (err) {
      const isTransient = 
        err.message.includes('timeout') ||
        err.message.includes('terminated unexpectedly') ||
        err.message.includes('ECONNRESET') ||
        err.message.includes('ETIMEDOUT');

      if (isTransient && attempt <= retries) {
        console.warn(`[CockroachDB] Reintentando query tras desconexión/arranque en frío (intento ${attempt} de ${retries + 1})...`);
        await new Promise(r => setTimeout(r, 1500 * attempt));
        continue;
      }
      console.error('Error al ejecutar query en CockroachDB:', { text, error: err.message });
      throw err;
    }
  }
}

module.exports = {
  pool,
  query,
};
