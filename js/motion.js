/**
 * DigiTeca Motion Engine (GSAP, Emil Kowalski & Apple Liquid Motion)
 * Aceleración por hardware (GPU), físicas elásticas y micro-interacciones interactivas
 */
(function(global){
  "use strict";

  var DigiMotion = {};

  // Verificar si el usuario prefiere movimiento reducido
  var prefersReduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── 1. CONTADOR NUMÉRICO DINÁMICO (ANIMATE NUMBER) ──
  DigiMotion.animateNumber = function(el, targetNumber, duration, suffix){
    if(!el) return;
    if(prefersReduced){
      el.textContent = targetNumber + (suffix || "");
      return;
    }
    duration = duration || 1200;
    suffix = suffix || "";
    var start = 0;
    var startTime = null;
    var target = parseFloat(targetNumber) || 0;

    el.classList.add("stat-counter-animate");

    function step(timestamp){
      if(!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      // Curva de desaceleración suave (ease-out-expo)
      var easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      var current = Math.floor(easeProgress * (target - start) + start);
      el.textContent = current.toLocaleString("es-AR") + suffix;
      if(progress < 1){
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString("es-AR") + suffix;
      }
    }
    requestAnimationFrame(step);
  };

  // ── 2. EFECTO 3D TILT & BRILLO REFLEJADO (SPECULAR GLARE) ──
  DigiMotion.initTiltCards = function(selector){
    if(prefersReduced) return;
    selector = selector || ".libro-card, .catalogo-card, .cover-img";
    var cards = document.querySelectorAll(selector);

    cards.forEach(function(card){
      if(card._tiltInitialized) return;
      card._tiltInitialized = true;
      card.classList.add("tilt-card");

      // Inyectar capa de brillo si no existe
      if(!card.querySelector(".glare-overlay")){
        var glare = document.createElement("div");
        glare.className = "glare-overlay";
        card.appendChild(glare);
      }

      card.addEventListener("mousemove", function(e){
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;

        var rotateX = ((y - centerY) / centerY) * -6.5; // Inclinación eje X
        var rotateY = ((x - centerX) / centerX) * 6.5;  // Inclinación eje Y

        card.style.transform = "perspective(900px) rotateX(" + rotateX.toFixed(2) + "deg) rotateY(" + rotateY.toFixed(2) + "deg) translateY(-4px) scale(1.02)";
        card.style.setProperty("--glare-x", ((x / rect.width) * 100).toFixed(1) + "%");
        card.style.setProperty("--glare-y", ((y / rect.height) * 100).toFixed(1) + "%");
      });

      card.addEventListener("mouseleave", function(){
        card.style.transform = "";
      });
    });
  };

  // ── 3. BARRA DE PROGRESO DE LECTURA FLOTANTE (READING PROGRESS) ──
  DigiMotion.initReadingProgress = function(containerSelector){
    var bar = document.getElementById("readingProgressBar");
    if(!bar){
      bar = document.createElement("div");
      bar.id = "readingProgressBar";
      bar.className = "reading-progress-bar";
      document.body.appendChild(bar);
    }

    var container = containerSelector ? document.querySelector(containerSelector) : window;

    function updateProgress(){
      var scrollTop = 0;
      var scrollHeight = 0;
      var clientHeight = 0;

      if(container === window || !containerSelector){
        scrollTop = window.scrollY || document.documentElement.scrollTop;
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
      } else if(container) {
        scrollTop = container.scrollTop;
        scrollHeight = container.scrollHeight;
        clientHeight = container.clientHeight;
      }

      var maxScroll = scrollHeight - clientHeight;
      var pct = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, pct)) + "%";
    }

    if(container === window || !containerSelector){
      window.addEventListener("scroll", updateProgress, { passive: true });
    } else if(container){
      container.addEventListener("scroll", updateProgress, { passive: true });
    }
  };

  // ── 4. REVELACIÓN EN CASCADA CON INTERSECTION OBSERVER (SCROLL REVEAL) ──
  DigiMotion.initScrollReveals = function(){
    if(typeof IntersectionObserver === "undefined") return;

    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("in-view");
          // Si tiene atributo data-counter, disparar animación numérica
          var counterVal = entry.target.dataset.counter;
          if(counterVal && !entry.target._counted){
            entry.target._counted = true;
            DigiMotion.animateNumber(entry.target, counterVal, 1400);
          }
        }
      });
    }, {
      rootMargin: "0px 0px -50px 0px",
      threshold: 0.1
    });

    var items = document.querySelectorAll(".stagger-item, [data-counter]");
    items.forEach(function(item){
      observer.observe(item);
    });
  };

  // ── 5. ANIMACIÓN FLIP DE REORDENAMIENTO DE TARJETAS (FILTROS FLUIDOS) ──
  DigiMotion.flipLayout = function(container, updateDomCallback){
    if(prefersReduced || !container){
      if(updateDomCallback) updateDomCallback();
      return;
    }

    var items = Array.from(container.children);
    var firstPositions = new Map();

    items.forEach(function(el){
      if(el.id || el.dataset.id){
        var key = el.id || el.dataset.id;
        firstPositions.set(key, el.getBoundingClientRect());
      }
    });

    if(updateDomCallback) updateDomCallback();

    requestAnimationFrame(function(){
      var newItems = Array.from(container.children);
      newItems.forEach(function(el){
        var key = el.id || el.dataset.id;
        if(key && firstPositions.has(key)){
          var first = firstPositions.get(key);
          var last = el.getBoundingClientRect();
          var dx = first.left - last.left;
          var dy = first.top - last.top;

          if(dx !== 0 || dy !== 0){
            el.style.transform = "translate(" + dx + "px, " + dy + "px)";
            el.style.transition = "none";

            requestAnimationFrame(function(){
              el.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
              el.style.transform = "";
            });
          }
        }
      });
    });
  };

  // ── AUTO-INIT EN DOMContentLoaded ──
  if(typeof document !== "undefined"){
    document.addEventListener("DOMContentLoaded", function(){
      DigiMotion.initTiltCards();
      DigiMotion.initScrollReveals();
    });
  }

  global.DigiMotion = DigiMotion;
})(typeof window !== "undefined" ? window : this);
