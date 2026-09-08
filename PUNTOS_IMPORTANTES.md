# 📌 PUNTOS IMPORTANTES Y REGLAS DE ARQUITECTURA - DIGITECA

Este documento recopila de forma permanente las directrices, restricciones de negocio, medidas de seguridad y optimizaciones de rendimiento del proyecto DigiTeca. **Debe ser consultado y respetado ante cualquier modificación futura del sistema.**

---

## 🚫 1. Prohibición Estricta de Descarga de Libros
* **Regla:** Está terminantemente **prohibido que los usuarios descarguen los libros** en formato PDF.
* **Prohibido:**
  * No colocar botones con atributos `download` ni textos "Descargar", "Descargar PDF", "Guardar libro".
  * No crear endpoints públicos tipo `/api/libros/:id/descargar`.
* **Comportamiento en la interfaz:**
  * En todas las vistas (`libro.html`, `catalogo.html`, `descargas.html`, `admin.html`), la única acción permitida para el usuario final es **"Leer en línea"** o previsualizar dentro del visor integrado.

---

## 🔒 2. Cifrado y Ofuscación de Enlaces de Lectura
* **Carga en Memoria (Blob URLs):**
  * Los PDFs **nunca** se incrustan usando la ruta estática directa del archivo en el DOM (ej. `src="/libros/archivo.pdf"`).
  * En su lugar, el visor (`libro.html`) realiza un `fetch()` al archivo, lo convierte en un `Blob` en la memoria del navegador y genera una URL efímera (`blob:http://...#toolbar=0&navpanes=0`).
  * Esta URL blob es única de la sesión actual en memoria, no se puede compartir por enlace externo y oculta las herramientas nativas de descarga del visor.
* **Redirección de Acceso Directo por URL:**
  * Si un usuario o atacante intenta escribir o pegar directamente la URL de un PDF en la barra de direcciones del navegador (ej. `http://localhost:3000/libros/ejemplo.pdf`), el middleware de Express en `server.js` detecta la navegación directa y **lo redirige automáticamente a `/catalogo.html`**, impidiendo abrir o guardar el archivo directamente.

---

## ⚠️ 3. Restricción sobre Clic Derecho y Atajos de Teclado
* **REGLA EXPLÍCITA DEL CLIENTE:**
  * **NO bloquear el clic derecho** (`oncontextmenu="return false;"`).
  * **NO interceptar ni cancelar combinaciones de teclas** como `Ctrl+S`, `Ctrl+P`, etc.
* **Razón:** Afecta negativamente la usabilidad y la experiencia del usuario. La protección contra descargas debe sostenerse en la ofuscación de URLs por Blob y la redirección del servidor, nunca en scripts intrusivos que bloquean el navegador.

---

## ⚡ 4. Base de Datos Ligera (Archivos en Disco, Rutas en BD)
* **Regla:** **NUNCA almacenar el contenido binario o Base64 de libros ni imágenes pesadas dentro de CockroachDB / PostgreSQL**.
* **Estrategia implementada:**
  * Los archivos PDF se guardan físicamente en el servidor dentro del directorio `/libros/`.
  * La base de datos almacena exclusivamente un string liviano con la referencia (ej. `/libros/1741234567890-libro.pdf`), pesando apenas unos 35 bytes por fila.
  * Esto garantiza que las consultas a la base de datos se ejecuten en milisegundos y no se saturen la memoria ni el ancho de banda.

---

## 🚀 5. Rendimiento Instantáneo y Estrategia SWR (Stale-While-Revalidate)
* **Caché en Cliente (0 ms de espera):**
  * El catálogo (`catalogo.html`), el visor (`libro.html`) y el panel resumen (`admin.html`) cargan inmediatamente los datos desde `sessionStorage` / `localStorage` al abrirse.
  * En segundo plano, se revalidan los datos contra el backend y se actualizan sin parpadeos ni bloqueos de pantalla.
* **Caché en Memoria del Servidor:**
  * Endpoints de alta concurrencia como `/api/libros` y métricas del admin cuentan con un caché TTL en RAM en Node.js, reduciendo drásticamente las consultas repetitivas a la base de datos.
* **Carga de Libros sin Espera:**
  * Al hacer clic en un libro desde el catálogo o panel, el objeto se transfiere a través del caché local para que la página de lectura cargue título, autor, portada y metadatos en 0 ms mientras se inicializa el PDF.

---

## 📊 6. Panel de Administración y Métricas Clave
* **Métricas Principales (5 KPIs esenciales):**
  1. Usuarios Registrados
  2. Libros en Catálogo
  3. Préstamos Activos
  4. Reseñas Totales
  5. Valoración Media
* **Métricas Eliminadas (a solicitud):**
  * *Restringidos* (eliminado).
  * *Guardados en Cuenta* (eliminado).
  * *Logins Hoy* (eliminado).

---

## 🌓 7. Botón de Modo Claro / Oscuro (Unificado con Morphicons)
* **Diseño e Iconografía:**
  * Debe ser idéntico en todas las páginas al de `index.html`: botón circular (40x40px, `border-radius: 50%`) con micro-interacción de escala (`scale(1.06)` al pasar el cursor, `scale(0.92)` al presionar).
  * Icono SVG Morphicons (20x20px) con transformación vectorial fluida de sol a luna (`createMorph`).
  * Colores dinámicos del icono: azul institucional (`#2E7FB3`) para la luna en modo claro y dorado cálido (`#F5D96A`) para el sol en modo oscuro.
* **Manejo de Scripts:**
  * Toda la lógica de cambio de tema se gestiona centralizadamente a través de `setupThemeToggle()` en `js/icons.js`.
  * **Prohibido:** No sobrescribir `themeBtn.onclick` con scripts inline destructivos que reemplacen el SVG por iconos estáticos (`DigiIcons.get("sun"/"moon")`).

---

## 🏫 8. Logo e Insignia Institucional (Unificado)
* **Regla de Visualización:**
  * En **todas** las vistas (públicas y panel de administración), la insignia oficial de la escuela (`img/logo.png`) debe mostrarse como un elemento circular perfecto:
    * `border-radius: 50% !important;`
    * `background: #FFFFFF !important;` (fondo blanco limpio para evitar que el fondo oscuro o negro del contenedor se trasluzca en las transparencias).
    * `border: 2px solid var(--cel-c);`
    * `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);`
    * Clase estándar: `.logo-img`.
  * **Prohibido:** No renderizar el logo como un cuadrado o rectángulo con bordes ligeramente redondeados (`border-radius: 10px / 16px`) ni permitir transparencias que generen fondos oscuros alrededor del escudo.

---

## 🛡️ 9. Prohibición Absoluta de Correos y Credenciales Hardcodeados en el Código
* **Regla de Oro de Seguridad:**
  * **Está estrictamente prohibido incluir correos electrónicos, contraseñas, tokens o listas de administradores hardcodeadas** dentro de los archivos HTML, JavaScript o bases de datos de prueba (ej. `ADMIN_EMAILS = [...]` o contraseñas por defecto tipo `"1234"`).
* **Control de Acceso Basado Exclusivamente en Roles (RBAC):**
  * La autorización para acceder al panel de administración o realizar operaciones privilegiadas debe evaluarse **únicamente a través del rol del usuario** (`rol === "admin" || rol === "administrador" || rol === "preceptor" || rol === "profesor"`) proveniente de la sesión autenticada contra la base de datos CockroachDB.
  * Nunca otorgar privilegios comparando contra cadenas de texto con correos específicos (`ADMIN_EMAILS.indexOf(email) >= 0`).
  * En interfaces o prototipos, usar únicamente placeholders o etiquetas genéricas (`usuario@correo.com`, `—`).

