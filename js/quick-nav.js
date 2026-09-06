/**
 * DigiTeca Quick-Nav
 * Acelerador de navegación instantánea entre páginas con prefetching inteligente
 */
(function() {
  if (typeof window === 'undefined' || !window.fetch) return;
  const prefetched = new Set();

  function prefetchUrl(url) {
    if (!url) return;
    try {
      const target = new URL(url, window.location.href);
      // Solo enlaces del mismo origen
      if (target.origin !== window.location.origin) return;
      // Evitar archivos binarios o endpoints de API
      if (target.pathname.match(/\.(pdf|png|jpg|jpeg|webp|zip)$/i) || target.pathname.startsWith('/api')) return;
      // Evitar la misma página
      if (target.pathname === window.location.pathname && target.search === window.location.search) return;

      const cleanUrl = target.pathname + target.search;
      if (prefetched.has(cleanUrl)) return;
      prefetched.add(cleanUrl);

      // Usar rel="prefetch" si es soportado, o fetch silencioso con prioridad baja
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = cleanUrl;
      link.as = 'document';
      document.head.appendChild(link);
    } catch(e) {}
  }

  function onInteraction(e) {
    const a = e.target.closest('a');
    if (!a || !a.href) return;
    prefetchUrl(a.href);
  }

  // Pre-cargar cuando el usuario pasa el mouse o toca el enlace
  document.addEventListener('mouseover', onInteraction, { passive: true });
  document.addEventListener('touchstart', onInteraction, { passive: true });

  // Pre-cargar rutas principales comunes suavemente tras 1 segundo de inactividad
  window.addEventListener('load', function() {
    setTimeout(function() {
      const rutasClave = ['catalogo.html', 'index.html', 'micuenta.html'];
      rutasClave.forEach(function(r) {
        if (!window.location.pathname.endsWith(r)) {
          prefetchUrl(r);
        }
      });
    }, 1200);
  });
})();
