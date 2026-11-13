/**
 * Comportamiento compartido de navegación, scroll, menú hamburguesa y acceso RBAC al Panel.
 */
(function (global) {
  function initSharedLayout() {
    var navbar = document.getElementById('navbar');
    var scrollBtn = document.getElementById('scroll-top') || document.getElementById('scrollTop');
    var ticking = false;

    function updateScroll() {
      var sy = window.scrollY || document.documentElement.scrollTop || 0;
      if (navbar) navbar.classList.toggle('scrolled', sy > 30);
      if (scrollBtn) {
        scrollBtn.classList.toggle('visible', sy > 200);
        scrollBtn.classList.toggle('on', sy > 360);
      }
      ticking = false;
    }

    if (navbar || scrollBtn) {
      window.addEventListener('scroll', function () {
        if (!ticking) {
          requestAnimationFrame(updateScroll);
          ticking = true;
        }
      }, { passive: true });
    }

    if (scrollBtn) {
      scrollBtn.onclick = function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    }

    if (typeof global.initHamburger === 'function') {
      global.initHamburger();
    } else {
      var hb = document.getElementById('hamburger');
      if (hb) {
        hb.onclick = function () {
          var navLinks = document.getElementById('navLinks');
          var isOpen = navLinks ? navLinks.classList.toggle('open') : false;
          this.classList.toggle('open', isOpen);
          this.setAttribute('aria-expanded', isOpen);
        };
      }
    }

    // Inyección centralizada del enlace "Panel" según rol autenticado
    try {
      var sesion = JSON.parse(localStorage.getItem('digi-sesion') || '{}');
      var rol = String(sesion.rol || '').trim().toLowerCase();
      var tieneAcceso = rol === 'admin' || rol === 'administrador' || rol === 'preceptor' || rol === 'profesor';
      if (tieneAcceso) {
        var navLinksEl = document.getElementById('navLinks');
        if (navLinksEl && !navLinksEl.querySelector('a[href="admin.html"]')) {
          var link = document.createElement('a');
          link.href = 'admin.html';
          link.innerHTML = (global.DigiIcons ? global.DigiIcons.get('settings', { size: 14, style: 'margin-right:4px' }) : '') + ' Panel';
          link.style.cssText = 'font-weight:700;color:var(--rojo,#C0392B)!important;background:rgba(192,57,43,.1);border-radius:8px;padding:8px 14px';
          navLinksEl.appendChild(link);
        }
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSharedLayout);
  } else {
    initSharedLayout();
  }

  global.DigiLayout = { init: initSharedLayout };
})(window);
