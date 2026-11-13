const { Readable } = require('stream');

/**
 * Resuelve enlaces de Google Drive al endpoint directo de descarga.
 */
function resolveUpstreamPdfUrl(pdfUrl) {
  if (pdfUrl.includes('drive.google.com')) {
    const driveMatch = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || pdfUrl.match(/id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return {
        downloadUrl: `https://drive.usercontent.google.com/download?id=${driveMatch[1]}&export=download&confirm=t`,
        driveId: driveMatch[1]
      };
    }
  }
  return { downloadUrl: pdfUrl, driveId: null };
}

/**
 * Retransmite un PDF remoto (GitHub Releases / Google Drive) con soporte de Range requests.
 */
async function streamRemotePdf(req, res, pdfUrl, titulo) {
  const { downloadUrl, driveId } = resolveUpstreamPdfUrl(pdfUrl);

  const fetchHeaders = {};
  if (req.headers.range) {
    fetchHeaders['Range'] = req.headers.range;
  }

  let upstream;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 35000);
    upstream = await fetch(downloadUrl, { headers: fetchHeaders, redirect: 'follow', signal: controller.signal });
    clearTimeout(timer);
  } catch (fetchErr) {
    console.warn(`[PDF Stream] Timeout o fallo en fetch (${downloadUrl}):`, fetchErr.message);
    return res.status(504).send('Tiempo de espera agotado al conectar con el repositorio de PDFs');
  }

  if (!upstream.ok && driveId) {
    try {
      upstream = await fetch(`https://drive.google.com/uc?export=download&id=${driveId}`, {
        headers: fetchHeaders,
        redirect: 'follow'
      });
    } catch (_) {}
  }

  if (!upstream || !upstream.ok) {
    return res.status(upstream ? upstream.status : 502).send('No se pudo obtener el PDF remoto');
  }

  if (upstream.status === 206) {
    res.status(206);
    const cr = upstream.headers.get('content-range');
    if (cr) res.setHeader('Content-Range', cr);
  }

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(titulo)}.pdf"`);
  res.setHeader('Access-Control-Allow-Origin', '*');

  const contentLength = upstream.headers.get('content-length');
  if (contentLength) res.setHeader('Content-Length', contentLength);

  if (upstream.body && typeof Readable.fromWeb === 'function') {
    Readable.fromWeb(upstream.body).pipe(res);
  } else {
    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  }
}

module.exports = {
  streamRemotePdf,
  resolveUpstreamPdfUrl
};
