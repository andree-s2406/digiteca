const express = require('express');
const router = express.Router();
const syncService = require('../services/sync');

// GET /api/sync/config - Configuración pública para el cliente Pusher en frontend
router.get('/config', (req, res) => {
  res.json(syncService.getPublicConfig());
});

// GET /api/sync/version - Consulta liviana de versiones con soporte de ETag / 304
router.get('/version', (req, res) => {
  const versions = syncService.getVersions();
  const etag = `"${Buffer.from(JSON.stringify(versions)).toString('base64').substring(0, 24)}"`;

  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('ETag', etag);

  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  res.json({
    status: 'ok',
    versions
  });
});

module.exports = router;
