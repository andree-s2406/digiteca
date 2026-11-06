# Directrices de Arquitectura y Reglas del Sistema - DigiTeca

Este documento compila de forma permanente las directrices técnicas, restricciones de negocio, medidas de seguridad y estándares de rendimiento del proyecto DigiTeca. Debe ser consultado y respetado ante cualquier modificación futura del sistema.

Para una descripción detallada de cada componente, consulte la documentación complementaria en el directorio `docs/`:
* [Arquitectura del Sistema](docs/ARQUITECTURA.md)
* [Referencia de la API REST](docs/API.md)
* [Especificación de la Base de Datos](docs/BASE_DE_DATOS.md)
* [Guía de Instalación y Despliegue](docs/DESPLIEGUE.md)

---

## 1. Prohibición Estricta de Descarga de Libros

* **Regla:** Está terminantemente prohibido que los usuarios descarguen los libros en formato físico o archivo local (PDF).
* **Restricciones de Código e Interfaz:**
  * No colocar botones con atributos `download` ni textos como "Descargar", "Descargar PDF" o "Guardar libro".
  * No exponer endpoints públicos destinados a la descarga de archivos.
* **Comportamiento en la Interfaz:**
  * En todas las vistas (`libro.html`, `catalogo.html`, `descargas.html`, `admin.html`), la única acción permitida para el usuario final es "Leer en línea" o previsualizar dentro del visor integrado.

---

## 2. Cifrado y Ofuscación de Enlaces de Lectura

* **Carga en Memoria (Blob URLs):**
  * Los archivos PDF nunca se incrustan utilizando la ruta estática directa del archivo en el DOM (por ejemplo: `src="/libros/archivo.pdf"`).
  * El visor (`libro.html`) realiza una petición mediante `fetch()` al archivo, lo convierte en un objeto `Blob` en la memoria volátil del navegador y genera una URL efímera (`blob:http://...#toolbar=0&navpanes=0`).
  * Dicha URL blob es exclusiva de la sesión en curso en memoria, no puede ser compartida mediante enlace externo y oculta las herramientas nativas de descarga del visor.
* **Redirección de Acceso Directo por URL:**
  * Si un usuario intenta acceder directamente a la URL de un PDF en la barra de direcciones del navegador (por ejemplo: `http://localhost:3000/libros/ejemplo.pdf`), el middleware de Express en `server.js` detecta la navegación directa a nivel de documento y lo redirige automáticamente a `/catalogo.html`, impidiendo abrir o guardar el archivo directamente.

---

## 3. Preservación de Usabilidad: Clic Derecho y Atajos de Teclado

* **Regla Explícita de Experiencia de Usuario:**
  * No bloquear el menú contextual del clic derecho (`oncontextmenu="return false;"`).
  * No interceptar ni cancelar combinaciones estándar de teclas como `Ctrl+S`, `Ctrl+P`, etc.
* **Fundamento:** Bloquear funciones nativas del navegador perjudica la accesibilidad y la experiencia del usuario. La protección contra descargas descansa en la ofuscación de URLs por Blob en memoria y en las redirecciones del servidor, no en scripts intrusivos en el cliente.

---

## 4. Almacenamiento Liviano en Base de Datos

* **Regla:** Nunca almacenar el contenido binario o cadenas Base64 de libros ni imágenes pesadas dentro de CockroachDB / PostgreSQL.
* **Estrategia Implementada:**
  * Los archivos PDF se conservan físicamente en el servidor dentro del directorio `/libros/`.
  * La base de datos almacena exclusivamente una cadena de texto corta con la ruta relativa de referencia (por ejemplo: `/libros/1741234567890-libro.pdf`).
  * Esto asegura que las consultas a la base de datos se ejecuten en pocos milisegundos y no saturen la memoria ni el ancho de banda de la red.

---

## 5. Rendimiento y Estrategia de Caché SWR (Stale-While-Revalidate)

* **Caché en Cliente:**
  * El catálogo (`catalogo.html`), el visor (`libro.html`) y el panel administrativo (`admin.html`) cargan inmediatamente los datos desde `sessionStorage` o `localStorage` al iniciarse.
  * En segundo plano, se revalidan los datos contra el backend y se actualizan sin parpadeos ni bloqueos visuales.
* **Caché en Memoria del Servidor:**
  * Endpoints de alta concurrencia como `/api/libros`, `/api/ranking` y `/api/stats` cuentan con una caché en memoria RAM con tiempo de vida (TTL) controlado en Node.js, reduciendo drásticamente las consultas repetitivas a la base de datos.
* **Carga Inmediata de Fichas Bibliográficas:**
  * Al seleccionar un libro desde el catálogo o panel, el objeto se transfiere a través del almacenamiento local para que la página de lectura cargue título, autor, portada y metadatos en 0 ms mientras se inicializa el flujo del PDF.

---

## 6. Panel de Administración y Métricas Clave

* **Métricas Principales (KPIs Esenciales):**
  1. Usuarios Registrados
  2. Libros en Catálogo
  3. Préstamos Activos
  4. Reseñas Totales
  5. Valoración Media
* **Métricas Descartadas:**
  * Restringidos (descartado).
  * Guardados en Cuenta (descartado de la vista principal).
  * Logins Hoy (descartado de la vista principal).

---

## 7. Selector de Modo Claro y Oscuro

* **Diseño e Iconografía:**
  * El botón de cambio de tema debe ser idéntico en todas las páginas: elemento circular (40x40px, `border-radius: 50%`) con micro-interacción de escala (`scale(1.06)` al posar el cursor, `scale(0.92)` al presionar).
  * Icono SVG interactivo con transición vectorial fluida de sol a luna mediante Morphicons.
  * Colores dinámicos del icono: azul institucional (`#2E7FB3`) para la luna en modo claro y dorado cálido (`#F5D96A`) para el sol en modo oscuro.
* **Manejo de Scripts:**
  * La lógica de cambio de tema se gestiona centralizadamente mediante `setupThemeToggle()` en `js/icons.js`.
  * No debe sobrescribirse `themeBtn.onclick` con scripts inline destructivos.

---

## 8. Logotipo e Insignia Institucional

* **Regla de Visualización:**
  * En todas las vistas (públicas y de administración), la insignia oficial de la escuela (`img/logo.png`) debe mostrarse como un elemento circular perfecto:
    * `border-radius: 50% !important;`
    * `background: #FFFFFF !important;` (fondo blanco limpio para evitar transparencias sobre fondos oscuros).
    * `border: 2px solid var(--cel-c);`
    * `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);`
    * Clase estándar: `.logo-img`.
  * No renderizar el logo como un rectángulo ni permitir transparencias que generen recortes oscuros alrededor del escudo.

---

## 9. Prohibición de Correos y Credenciales Hardcodeados

* **Regla de Seguridad:**
  * Está estrictamente prohibido incluir correos electrónicos, contraseñas, tokens o listas de administradores codificadas de forma estática dentro de los archivos HTML, JavaScript o scripts de prueba.
* **Control de Acceso Basado en Roles (RBAC):**
  * La autorización para acceder al panel de administración o realizar operaciones privilegiadas debe evaluarse únicamente a través del rol del usuario (`rol === "admin" || rol === "administrador" || rol === "preceptor" || rol === "profesor"`) proveniente de la sesión autenticada en la base de datos CockroachDB.
  * No deben otorgarse privilegios comparando contra listas de correos específicos.
  * En interfaces o prototipos, deben utilizarse únicamente marcadores de posición o etiquetas genéricas (`usuario@correo.com`, `—`).
