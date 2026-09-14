/**
 * DigiTeca Universal Real-Time Sync & Multi-Device Cache Manager
 * Soporte para Pusher WebSockets, BroadcastChannel y detección por versiones (ETag).
 */
(function(window) {
  'use strict';

  const DigiSync = {
    pusher: null,
    channel: null,
    broadcastChannel: null,
    lastVersions: {
      usuarios: 0,
      libros: 0,
      stats: 0
    },

    init: async function() {
      // 1. Cargar versiones previas desde localStorage si existen
      try {
        const saved = JSON.parse(localStorage.getItem('digi-sync-versions') || '{}');
        if (saved) this.lastVersions = { ...this.lastVersions, ...saved };
      } catch (e) {}

      // 2. Iniciar BroadcastChannel para pestañas en el mismo navegador
      try {
        if ('BroadcastChannel' in window) {
          this.broadcastChannel = new BroadcastChannel('digiteca-local-sync');
          this.broadcastChannel.onmessage = (event) => {
            if (event.data && event.data.module) {
              this.handleDataChange(event.data, false);
            }
          };
        }
      } catch (e) {
        console.warn('[DigiSync] BroadcastChannel no soportado:', e.message);
      }

      // 3. Listener para cambios de visibilidad o enfoque (ej. desbloquear celular, volver a la pestaña)
      const onFocusOrVisible = () => {
        if (document.visibilityState === 'visible') {
          this.checkVersions();
        }
      };
      document.addEventListener('visibilitychange', onFocusOrVisible);
      window.addEventListener('focus', onFocusOrVisible);

      // 4. Conectar con Pusher
      await this.initPusher();

      // 5. Verificación inicial de versiones
      this.checkVersions();
    },

    initPusher: async function() {
      try {
        const res = await fetch('/api/sync/config');
        if (!res.ok) return;
        const config = await res.json();

        if (!config.enabled || !config.key) {
          console.log('[DigiSync] Modo fallback activo (sin credenciales de Pusher).');
          return;
        }

        // Si la librería de Pusher no está en el HTML, cargarla dinámicamente
        if (typeof window.Pusher === 'undefined') {
          await this.loadPusherScript();
        }

        if (typeof window.Pusher !== 'undefined') {
          this.pusher = new window.Pusher(config.key, {
            cluster: config.cluster,
            forceTLS: true
          });

          const channelName = config.channel || 'digiteca-live';
          this.channel = this.pusher.subscribe(channelName);

          this.channel.bind('data-changed', (data) => {
            console.log('[DigiSync] Notificación Pusher recibida:', data);
            this.handleDataChange(data, true);
          });

          console.log(`[DigiSync] Pusher conectado al canal "${channelName}" (cluster: ${config.cluster})`);
        }
      } catch (err) {
        console.warn('[DigiSync] Error inicializando Pusher:', err.message);
      }
    },

    loadPusherScript: function() {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://js.pusher.com/8.2.0/pusher.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('No se pudo cargar pusher.min.js'));
        document.head.appendChild(script);
      });
    },

    handleDataChange: function(data, broadcast = true) {
      if (!data || !data.module) return;

      const mod = data.module;
      const ver = data.version || Date.now();

      // Actualizar marca local
      this.lastVersions[mod] = ver;
      try {
        localStorage.setItem('digi-sync-versions', JSON.stringify(this.lastVersions));
      } catch (e) {}

      // Limpiar caché en memoria de api.js si existe
      if (window.API && typeof window.API.clearCache === 'function') {
        window.API.clearCache();
      }

      // Manejo específico por módulo
      if (mod === 'usuarios') {
        try {
          // Limpiar caché local de usuarios para forzar descarga limpia
          localStorage.removeItem('digi-admin-usuarios');
        } catch (e) {}

        // Si el usuario modificado es el de la sesión actual, refrescar digi-sesion
        try {
          const sesion = JSON.parse(localStorage.getItem('digi-sesion') || '{}');
          if (sesion.email && data.email && sesion.email.toLowerCase() === data.email.toLowerCase()) {
            this.refreshCurrentSession();
          }
        } catch (e) {}

        // Disparar evento para que la vista activa (admin.html, micuenta.html) actualice su UI
        window.dispatchEvent(new CustomEvent('digi:usuarios-updated', { detail: data }));
      }

      if (mod === 'libros') {
        try {
          localStorage.removeItem('digi-admin-libros');
        } catch (e) {}

        window.dispatchEvent(new CustomEvent('digi:libros-updated', { detail: data }));
      }

      if (mod === 'stats') {
        try {
          localStorage.removeItem('digi-stats');
        } catch (e) {}

        window.dispatchEvent(new CustomEvent('digi:stats-updated', { detail: data }));
      }

      // Replicar a otras pestañas abiertas en este mismo navegador
      if (broadcast && this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage(data);
        } catch (e) {}
      }
    },

    // Consulta de versiones al servidor (con soporte ETag)
    checkVersions: async function() {
      try {
        const res = await fetch('/api/sync/version', { cache: 'no-cache' });
        if (res.status === 304) {
          return; // No hubo cambios
        }
        if (!res.ok) return;

        const data = await res.json();
        if (data && data.versions) {
          for (const [mod, serverVer] of Object.entries(data.versions)) {
            const localVer = this.lastVersions[mod] || 0;
            if (serverVer > localVer) {
              console.log(`[DigiSync] Detectada nueva versión de "${mod}": Servidor (${serverVer}) > Local (${localVer})`);
              this.handleDataChange({ module: mod, version: serverVer, action: 'sync-check' }, true);
            }
          }
        }
      } catch (err) {
        // En caso de estar offline, no saturar la consola
      }
    },

    // Actualiza la sesión local si se modificó el perfil en otro dispositivo
    refreshCurrentSession: async function() {
      try {
        let sesion = JSON.parse(localStorage.getItem('digi-sesion') || '{}');
        if (!sesion.email) return;

        const res = await fetch('/api/usuarios/me', {
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': sesion.email,
            'x-user-rol': sesion.rol || 'alumno'
          }
        });

        if (res.ok) {
          const freshUser = await res.json();
          if (freshUser && freshUser.email) {
            const updatedSesion = { ...sesion, ...freshUser };
            localStorage.setItem('digi-sesion', JSON.stringify(updatedSesion));

            // Si estamos en micuenta, actualizar campos de pantalla
            if (typeof window.cargarSesion === 'function' && typeof window.poblarUI === 'function') {
              window.cargarSesion();
              window.poblarUI();
            }

            // Actualizar avatar del header si existe
            const avatarEl = document.querySelector('.user-avatar, #headerAvatar, .nav-avatar');
            if (avatarEl && freshUser.avatar) {
              avatarEl.src = freshUser.avatar;
            }

            console.log('[DigiSync] Sesión de usuario actualizada automáticamente con datos del servidor.');
          }
        }
      } catch (e) {
        console.warn('[DigiSync] Error al refrescar sesión actual:', e.message);
      }
    },

    notifyLocalChange: function(moduleName, payload = {}) {
      this.handleDataChange({ module: moduleName, version: Date.now(), ...payload }, true);
    }
  };

  // Inicializar en cuanto el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DigiSync.init());
  } else {
    DigiSync.init();
  }

  window.DigiSync = DigiSync;
})(window);
