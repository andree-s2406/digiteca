/**
 * DigiTeca Universal Icon Manager
 * Official integration of Lucide Icons with fallback support for
 * Tabler Icons, Heroicons, Morphicons and Iconify API.
 * Priority: 1. Lucide -> 2. Tabler -> 3. Heroicons -> 4. Morphicons -> 5. Iconify API
 */

(function(global) {
  // Alias / Mapeo de términos de DigiTeca a nombres canónicos de Lucide Icons
  const ICON_ALIASES = {
    // Materias y áreas
    'matematica': 'calculator',
    'ciencias': 'flask-conical',
    'quimica': 'test-tube-2',
    'fisica': 'atom',
    'biologia': 'dna',
    'historia': 'landmark',
    'geografia': 'globe',
    'lengua': 'book-open',
    'literatura': 'feather',
    'ingles': 'languages',
    'tecnologia': 'cpu',
    'informatica': 'laptop',
    'programacion': 'code-2',
    'terminal': 'terminal',
    'simulador': 'gamepad-2',
    'revista': 'newspaper',
    'libros': 'library',
    'mas-buscados': 'flame',
    'destacado': 'sparkles',
    'todos': 'grid',
    
    // UI y Acciones
    'admin': 'shield',
    'usuario': 'user',
    'usuarios': 'users',
    'profesor': 'graduation-cap',
    'estudiante': 'user',
    'preceptor': 'user-check',
    'buscar': 'search',
    'limpiar': 'trash-2',
    'eliminar': 'trash-2',
    'editar': 'pencil',
    'guardar': 'check',
    'descarga': 'download',
    'descargas': 'download-cloud',
    'ver': 'eye',
    'ocultar': 'eye-off',
    'candado': 'lock',
    'abierto': 'unlock',
    'subir': 'arrow-up',
    'bajar': 'arrow-down',
    'volver': 'arrow-left',
    'siguiente': 'arrow-right',
    'cerrar': 'x',
    'menu': 'menu',
    'alerta': 'alert-triangle',
    'info': 'info',
    'sol': 'sun',
    'luna': 'moon',
    'reloj': 'clock',
    'calendario': 'calendar',
    'ranking': 'trophy',
    'estadisticas': 'bar-chart-2',
    'config': 'settings',
    'pantalla-completa': 'maximize',
    'salir-pantalla-completa': 'minimize',
    'carga': 'loader-2',
    'exito': 'check-circle-2',
    'error': 'x-circle'
  };

  /**
   * Convierte kebab-case a PascalCase para búsqueda en el diccionario de Lucide
   */
  function toPascalCase(str) {
    if (!str) return '';
    return String(str).split('-').map(function(s) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    }).join('');
  }

  /**
   * Resuelve el nombre canónico del icono en Lucide
   */
  function resolveIconName(name) {
    if (!name) return 'book';
    const clean = String(name).toLowerCase().trim();
    return ICON_ALIASES[clean] || clean;
  }

  /**
   * Convierte el AST de nodo de Lucide directamente a un elemento SVG válido
   */
  function renderLucideNode(iconNode, attrs) {
    attrs = attrs || {};
    const width = attrs.width || 24;
    const height = attrs.height || 24;
    const strokeWidth = attrs['stroke-width'] || 2;
    const stroke = attrs.stroke || 'currentColor';
    const className = attrs.class || '';
    const style = attrs.style || '';

    const children = iconNode.map(function(child) {
      const tag = child[0];
      const childAttrs = child[1];
      const attrStr = Object.keys(childAttrs).map(function(k) {
        return k + '="' + childAttrs[k] + '"';
      }).join(' ');
      return '<' + tag + ' ' + attrStr + '></' + tag + '>';
    }).join('');

    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" stroke-linecap="round" stroke-linejoin="round" class="lucide digi-icon ' + className + '" style="' + style + '">' + children + '</svg>';
  }

  const DigiIcons = {
    aliases: ICON_ALIASES,

    /**
     * Retorna la cadena HTML para un icono oficial de Lucide
     * @param {string} name - Nombre o alias del icono
     * @param {object} options - Opciones: size, strokeWidth, class, style, color
     */
    get: function(name, options) {
      options = options || {};
      const iconName = resolveIconName(name);
      const pascalName = toPascalCase(iconName);
      const size = options.size || 18;
      const strokeWidth = options.strokeWidth || 2;
      const className = options.class || '';
      const style = options.style || '';
      const color = options.color || 'currentColor';

      // 1. Renderizar directamente mediante la librería Lucide oficial si está disponible
      if (global.lucide && global.lucide.icons && global.lucide.icons[pascalName]) {
        try {
          return renderLucideNode(global.lucide.icons[pascalName], {
            width: size,
            height: size,
            'stroke-width': strokeWidth,
            class: className,
            stroke: color,
            style: style
          });
        } catch (e) {
          console.warn('Error renderLucideNode:', iconName, e);
        }
      }

      // 2. Si Lucide aún no terminó de cargar o se llama estáticamente, emitir elemento data-lucide
      return `<i data-lucide="${iconName}" class="digi-icon ${className}" style="display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;vertical-align:middle;${style}" data-size="${size}" data-stroke-width="${strokeWidth}"></i>`;
    },

    /**
     * Renderiza todos los iconos <i data-lucide="..."> o <i data-icon="..."> en el documento o contenedor
     * @param {HTMLElement} root - Contenedor opcional (por defecto document.body)
     */
    create: function(root) {
      if (!global.lucide || typeof global.lucide.createIcons !== 'function') {
        return;
      }

      try {
        const container = root || document;
        const iconNodes = container.querySelectorAll ? container.querySelectorAll('[data-lucide], [data-icon]') : [];
        
        iconNodes.forEach(function(el) {
          const current = el.getAttribute('data-lucide') || el.getAttribute('data-icon');
          const resolved = resolveIconName(current);
          if (resolved !== current) {
            el.setAttribute('data-lucide', resolved);
          }
          if (!el.classList.contains('digi-icon')) {
            el.classList.add('digi-icon');
          }
        });

        // Ejecutar creación oficial de Lucide
        global.lucide.createIcons({
          root: container,
          nameAttr: 'data-lucide',
          attrs: {
            'stroke-width': 2,
            class: 'lucide-icon'
          }
        });
      } catch (err) {
        console.warn('DigiIcons.create error:', err);
      }
    },

    /**
     * Resolver dinámico mediante Iconify API si un icono no se encuentra localmente
     */
    fetchIconifySVG: async function(prefix, iconName) {
      try {
        const res = await fetch(`https://api.iconify.design/${prefix}/${iconName}.svg`);
        if (res.ok) {
          return await res.text();
        }
      } catch (err) {
        console.warn('Iconify API error:', err);
      }
      return null;
    }
  };

  // Helper global getSVGIcon para compatibilidad total con cualquier script existente
  global.getSVGIcon = function(key, size, extraClass, extraStyle) {
    return DigiIcons.get(key, {
      size: size || 18,
      class: extraClass || '',
      style: extraStyle || ''
    });
  };

  global.DigiIcons = DigiIcons;

  
  // ── MANEJADOR DE USUARIO ESTILO YOUTUBE (PALETA ALEATORIA E INICIAL REAL) ──
  var AVATAR_PALETTE = [
    '#E65100', // Naranja
    '#1565C0', // Azul eléctrico
    '#2E7D32', // Verde
    '#6A1B9A', // Púrpura
    '#C2185B', // Rosa intenso
    '#00838F', // Cian oscuro / Teal
    '#D84315', // Rojo teja
    '#4527A0', // Índigo profundo
    '#00695C', // Verde esmeralda
    '#AD1457', // Carmesí
    '#EF6C00', // Ámbar brillante
    '#283593'  // Azul zafiro
  ];

  function getAvatarColor(seed) {
    if (!seed) {
      return AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)];
    }
    var hash = 0;
    for (var i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    var idx = Math.abs(hash) % AVATAR_PALETTE.length;
    return AVATAR_PALETTE[idx];
  }

  function initUserMenu() {
    var sesion = {};
    var cuenta = {};
    try { sesion = JSON.parse(localStorage.getItem("digi-sesion") || "{}"); } catch(e){}
    try { cuenta = JSON.parse(localStorage.getItem("digi-cuenta") || "{}"); } catch(e){}

    var nombre = (cuenta.nombre || sesion.nombre || "").trim();
    var apellido = (cuenta.apellido || sesion.apellido || "").trim();
    var email = (cuenta.correo || sesion.email || "").trim();
    var avatar = cuenta.avatar || sesion.avatar || "";

    var displayName = (nombre + " " + apellido).trim() || (email ? email.split("@")[0] : "") || "Estudiante";
    var initial = (nombre.charAt(0) || email.charAt(0) || "?").toUpperCase();
    var color = getAvatarColor(nombre || email || displayName);

    var btn = document.getElementById("userAvatarBtn");
    var dropAvatar = document.querySelector(".user-dropdown-avatar");
    if (btn) btn.style.backgroundColor = color;
    if (dropAvatar) dropAvatar.style.backgroundColor = color;

    var navLetter = document.getElementById("navUserInitial");
    var navImg = document.getElementById("navUserImg");
    var dropLetter = document.getElementById("dropUserInitial");
    var dropImg = document.getElementById("dropUserImg");
    var dropName = document.getElementById("dropUserName");
    var dropEmail = document.getElementById("dropUserEmail");

    if (navLetter) navLetter.textContent = initial;
    if (dropLetter) dropLetter.textContent = initial;
    if (dropName) dropName.textContent = displayName;
    if (dropEmail) dropEmail.textContent = email || "sin correo registrado";

    if (avatar) {
      if (navImg) { navImg.src = avatar; navImg.style.display = "block"; }
      if (navLetter) navLetter.style.display = "none";
      if (dropImg) { dropImg.src = avatar; dropImg.style.display = "block"; }
      if (dropLetter) dropLetter.style.display = "none";
    } else {
      if (navImg) { navImg.src = ""; navImg.style.display = "none"; }
      if (navLetter) navLetter.style.display = "flex";
      if (dropImg) { dropImg.src = ""; dropImg.style.display = "none"; }
      if (dropLetter) dropLetter.style.display = "flex";
    }

    var ADMIN_EMAILS = [
      "andresfeliperodriguezmora448@gmail.com",
    "franco.parrucci.058@alu.tecnica29de6.edu.ar",
      "andres.rodriguez.750@alu.tecnica29de6.edu.ar",
      "lucas.solohaga.031@alu.tecnica29de6.edu.ar"
    ];
    var rol = (sesion.rol || "").toLowerCase();
    var esAdmin = rol === "admin" || rol === "preceptor" || rol === "profesor" || (email && ADMIN_EMAILS.indexOf(email.toLowerCase()) >= 0);
    var dropAdmin = document.getElementById("dropAdminItem");
    if (dropAdmin) {
      dropAdmin.style.display = esAdmin ? "block" : "none";
    }
  }

  function toggleUserDropdown(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    var drop = document.getElementById("userDropdown");
    var btn = document.getElementById("userAvatarBtn");
    if (!drop) return;
    var isOpen = drop.classList.contains("open");
    drop.classList.toggle("open", !isOpen);
    if (btn) btn.setAttribute("aria-expanded", !isOpen ? "true" : "false");
  }

  function cerrarSesionGlobal() {
    try {
      localStorage.removeItem("digi-sesion");
      localStorage.removeItem("digi-cuenta");
    } catch(e){}
    window.location.href = "login.html";
  }

  global.initUserMenu = initUserMenu;

  // ── MORPHICONS TRANSICIÓN OFICIAL SOL <-> LUNA (www.morphicons.com) ──
  var SUN_PATH = 'M 12 8 a 4 4 0 1 0 0.001 0 Z M 12 2 v 2 M 12 20 v 2 M 4.93 4.93 l 1.41 1.41 M 17.66 17.66 l 1.41 1.41 M 2 12 h 2 M 20 12 h 2 M 6.34 17.66 l -1.41 1.41 M 19.07 4.93 l -1.41 1.41';
  var MOON_PATH = 'M 12 3 a 6 6 0 0 0 9 9 9 9 0 1 1 -9 -9 Z';

  function setupThemeToggle() {
    var btn = document.getElementById("themeBtn");
    var root = document.documentElement;
    if (!btn) return;
    if (btn._themeToggleInitialized) return;
    btn._themeToggleInitialized = true;

    // Asegurar estructura SVG con path para Morphicons
    var path = btn.querySelector(".theme-morph-path");
    if (!path) {
      btn.innerHTML = '<svg class="theme-morph-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path class="theme-morph-path"></path></svg>';
      path = btn.querySelector(".theme-morph-path");
    }

    var isDark = root.classList.contains("dark");
    var morph = null;
    if (global.createMorph && path) {
      try {
        morph = global.createMorph(path, isDark ? SUN_PATH : MOON_PATH);
      } catch(e){ console.warn("createMorph init:", e); }
    } else if (path) {
      path.setAttribute("d", isDark ? SUN_PATH : MOON_PATH);
    }

    function applyTheme(dark, animate) {
      if (dark) {
        root.classList.add("dark");
        btn.setAttribute("title", "Cambiar a modo claro");
      } else {
        root.classList.remove("dark");
        btn.setAttribute("title", "Cambiar a modo oscuro");
      }
      try { localStorage.setItem("digi", dark ? "dark" : "light"); } catch(e){}

      var targetPath = dark ? SUN_PATH : MOON_PATH;
      var svg = btn.querySelector(".theme-morph-svg");

      if (animate) {
        btn.classList.add("is-animating");
        // Gira al mismo tiempo que la forma se transforma y se detiene exactamente al terminar
        if (svg) {
          svg.style.transform = dark ? "rotate(360deg)" : "rotate(0deg)";
        }

        if (morph && typeof morph.morphTo === "function") {
          morph.morphTo(targetPath, "snappy");
        } else if (global.createMorph && path) {
          morph = global.createMorph(path, targetPath);
        } else if (path) {
          path.setAttribute("d", targetPath);
        }
      } else {
        btn.classList.remove("is-animating");
        if (svg) {
          svg.style.transform = dark ? "rotate(360deg)" : "rotate(0deg)";
        }
        if (morph && typeof morph.set === "function") morph.set(targetPath);
        else if (path) path.setAttribute("d", targetPath);
      }
    }

    // Inicializar según preferencia almacenada
    var saved = "";
    try { saved = localStorage.getItem("digi") || ""; } catch(e){}
    var preferDark = saved === "dark" || (saved !== "light" && typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme:dark)").matches);
    applyTheme(preferDark, false);
    // Quitar clase preload para permitir transiciones suaves en futuros clics
    setTimeout(function() {
      root.classList.remove("preload");
    }, 120);

    btn.onclick = function(e) {
      if (e) e.preventDefault();
      var nextDark = !root.classList.contains("dark");
      applyTheme(nextDark, true);
    };
  }

  global.setupThemeToggle = setupThemeToggle;

  global.toggleUserDropdown = toggleUserDropdown;
  global.cerrarSesionGlobal = cerrarSesionGlobal;

  if (typeof document !== 'undefined') {
    document.addEventListener("click", function(e) {
      var wrap = document.getElementById("userMenuWrap");
      var drop = document.getElementById("userDropdown");
      if (drop && wrap && !wrap.contains(e.target)) {
        drop.classList.remove("open");
        var btn = document.getElementById("userAvatarBtn");
        if (btn) btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Auto inicializar cuando el DOM esté listo
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        DigiIcons.create();
        initUserMenu();
        setupThemeToggle();
      });
    } else {
      setTimeout(function() {
        DigiIcons.create();
        initUserMenu();
        setupThemeToggle();
      }, 0);
    }
  }

})(typeof window !== 'undefined' ? window : this);
