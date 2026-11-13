/**
 * Lógica de dominio compartida para libros: limpieza de portadas y visibilidad por división.
 */
(function (global) {
  function getCleanCover(img) {
    var s = String(img || '').trim();
    if (!s || s === 'undefined' || s === 'null') return '';
    if (s.indexOf('covers.openlibrary.org') !== -1) return '';
    if (s.indexOf('file:') === 0 || s.indexOf('test.jpg') !== -1) return 'img/test.jpg';
    return s;
  }

  function filtrarPorDivisionUsuario(libros) {
    if (!Array.isArray(libros)) return [];
    var ses = {};
    try { ses = JSON.parse(localStorage.getItem('digi-sesion') || '{}'); } catch (e) {}
    var rol = String(ses.rol || 'alumno').toLowerCase();
    if (rol === 'admin' || rol === 'administrador' || rol === 'profesor' || rol === 'preceptor') {
      return libros;
    }

    var divU = '';
    try {
      var cta = JSON.parse(localStorage.getItem('digi-cuenta') || '{}');
      divU = (cta.division || ses.div || ses.division || '').trim();
    } catch (e) {
      divU = (ses.div || ses.division || '').trim();
    }

    var ld = {};
    try { ld = JSON.parse(localStorage.getItem('digi-libros-divs') || '{}'); } catch (e) {}

    return libros.filter(function (l) {
      var dArr = ld[l.id] !== undefined ? ld[l.id] : (Array.isArray(l.divisiones) ? l.divisiones : []);
      if (!dArr || dArr.length === 0) return true;
      if (!divU) return true;
      return dArr.indexOf(divU) !== -1;
    });
  }

  function getPdfStreamUrl(libro) {
    if (!libro) return '';
    if (libro.id) return '/api/libros/' + encodeURIComponent(libro.id) + '/pdf';
    return libro.pdf || libro.pdf_url || '';
  }

  global.DigiLibros = {
    getCleanCover: getCleanCover,
    filtrarPorDivisionUsuario: filtrarPorDivisionUsuario,
    getPdfStreamUrl: getPdfStreamUrl
  };

  if (typeof global.filtrarPorDivisionUsuario !== 'function') {
    global.filtrarPorDivisionUsuario = filtrarPorDivisionUsuario;
  }
})(window);
