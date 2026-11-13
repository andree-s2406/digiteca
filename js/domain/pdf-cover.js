/**
 * Extracción compartida de portada desde la primera página de un PDF usando PDF.js.
 */
(function (global) {
  async function renderFirstPageToDataUrl(pdfDoc, maxWidth) {
    var page = await pdfDoc.getPage(1);
    var origVp = page.getViewport({ scale: 1 });
    var scale = (maxWidth || 320) / origVp.width;
    var vp = page.getViewport({ scale: scale });
    var canvas = document.createElement('canvas');
    canvas.width = Math.round(vp.width);
    canvas.height = Math.round(vp.height);
    var ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    return canvas.toDataURL('image/jpeg', 0.82);
  }

  async function fetchPdfPage1AsDataUrl(pdfUrl, maxWidth) {
    if (!global.pdfjsLib) throw new Error('PDF.js no disponible');
    var doc = await global.pdfjsLib.getDocument({
      url: pdfUrl,
      disableRange: false,
      disableStream: false
    }).promise;
    try {
      return await renderFirstPageToDataUrl(doc, maxWidth || 320);
    } finally {
      if (doc && typeof doc.destroy === 'function') {
        try { doc.destroy(); } catch (_) {}
      }
    }
  }

  async function uploadDataUrlCover(dataUrl, libro) {
    if (!global.API || !global.API.upload || !global.DigiUtils) return '';
    var blob = global.DigiUtils.dataURLtoBlob(dataUrl);
    var file = new File([blob], 'portada_' + (libro.id || Date.now()) + '.jpg', { type: 'image/jpeg' });
    var upRes = await global.API.upload.portada(file);
    if (upRes && upRes.url && libro && libro.id) {
      await global.API.libros.update(libro.id, {
        t: libro.t || libro.titulo,
        a: libro.a || libro.autor,
        mat: libro.mat || libro.materia,
        tipo: libro.tipo || 'Libro',
        anios: libro.anios || [],
        divisiones: libro.divisiones || [],
        img: upRes.url,
        pdf: libro.pdf || libro.pdf_url || '',
        e: libro.e || libro.emoji || '📚',
        x: libro.x || libro.descripcion || ''
      });
      return upRes.url;
    }
    return '';
  }

  global.DigiPdfCover = {
    renderFirstPageToDataUrl: renderFirstPageToDataUrl,
    fetchPdfPage1AsDataUrl: fetchPdfPage1AsDataUrl,
    uploadDataUrlCover: uploadDataUrlCover
  };
})(window);
