/**
 * Inicialización síncrona de tema (evita FOUC) y guarda de sesión/RBAC.
 * Debe cargarse en <head> antes de renderizar el body.
 */
(function () {
  try {
    var d = localStorage.getItem('digi');
    var isDark = d === 'dark' || (d !== 'light' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.classList.add('preload');
  } catch (e) {}

  var page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var isLoginPage = page === 'login.html';
  var requireAdmin = page === 'admin.html' || window.__DIGI_REQUIRE_ADMIN__ === true;

  var sesion = null;
  try {
    var raw = localStorage.getItem('digi-sesion');
    if (raw) sesion = JSON.parse(raw);
  } catch (e) {}

  var hasSession = !!(sesion && sesion.email);

  if (isLoginPage) {
    if (hasSession && !window.location.search.includes('logout')) {
      window.location.replace('index.html');
    }
    return;
  }

  if (!hasSession) {
    window.location.replace('login.html');
    return;
  }

  if (requireAdmin) {
    var rol = String(sesion.rol || '').trim().toLowerCase();
    var allowed = rol === 'admin' || rol === 'administrador' || rol === 'preceptor' || rol === 'profesor';
    if (!allowed) {
      window.location.replace('index.html');
      return;
    }
  }

  // Remover estilo ocultador si existe en <head>
  var guardCss = document.getElementById('auth-guard-css');
  if (guardCss) guardCss.remove();
})();
