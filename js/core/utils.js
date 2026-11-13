/**
 * Utilidades puras compartidas en el frontend DigiTeca.
 */
(function (global) {
  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatFechaAR(dateInput) {
    var d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function dataURLtoBlob(dataurl) {
    var arr = String(dataurl || '').split(',');
    var mimeMatch = arr[0].match(/:(.*?);/);
    var mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    var bstr = atob(arr[1] || '');
    var n = bstr.length;
    var u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  global.DigiUtils = {
    norm: norm,
    escHtml: escHtml,
    formatFechaAR: formatFechaAR,
    dataURLtoBlob: dataURLtoBlob
  };
  // Alias globales retrocompatibles
  if (typeof global.norm !== 'function') global.norm = norm;
  if (typeof global.dataURLtoBlob !== 'function') global.dataURLtoBlob = dataURLtoBlob;
})(window);
