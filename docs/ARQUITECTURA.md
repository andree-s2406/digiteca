# Arquitectura del Sistema y Directrices Técnicas - DigiTeca

## 1. Visión General del Proyecto

DigiTeca es una plataforma de biblioteca digital diseñada para la comunidad educativa de la Escuela Técnica N° 29 D.E. 6 "Reconquista de Buenos Aires". El sistema permite a estudiantes, docentes y directivos consultar catálogos bibliográficos, realizar lecturas en línea de textos académicos y técnicos, administrar usuarios y recopilar métricas operativas de uso institucional.

La solución está concebida bajo principios de alta disponibilidad, bajo consumo de recursos en base de datos, seguridad de contenidos protegidos y una experiencia de usuario rápida y receptiva.

---

## 2. Diagrama General de Arquitectura

```
+-----------------------------------------------------------------------+
|                         CAPA DE CLIENTE (FRONTEND)                     |
|  - HTML5 Semántico + CSS3 Variables (Modo Claro / Oscuro)             |
|  - Vanilla JavaScript Modular (ES6+)                                   |
|  - Lector Integrado PDF.js con Ofuscación en Memoria (Blob URLs)       |
|  - Sincronización en Tiempo Real: Pusher Client + BroadcastChannel     |
|  - Caché Local del Navegador (Stale-While-Revalidate / SessionStorage) |
+-----------------------------------+-----------------------------------+
                                    |
                            HTTP/REST / WebSockets
                                    |
+-----------------------------------v-----------------------------------+
|                        CAPA DE SERVIDOR (BACKEND)                     |
|  - Node.js + Express.js                                               |
|  - Compresión GZIP de alta velocidad (compression)                    |
|  - Cabeceras de Seguridad (X-Content-Type-Options, Frame-Options, etc)|
|  - Rate Limiter para mitigación de fuerza bruta                       |
|  - Guardián de Autorización RBAC (Role-Based Access Control)          |
|  - Gestor de Caché en Memoria RAM para Endpoints de Alta Demanda      |
|  - Servicio de Carga de Archivos Multipart (Multer)                   |
|  - Emisor de Eventos de Sincronización (Pusher Server SDK)            |
+-----------------------------------+-----------------------------------+
                                    |
                            pg Driver (TLS/SSL)
                                    |
+-----------------------------------v-----------------------------------+
|                     CAPA DE DATOS (PERSISTENCIA)                      |
|  - Motor: CockroachDB Serverless / PostgreSQL                         |
|  - Pool de Conexiones Resistente con Reintentos de Arranque en Frío   |
|  - Almacenamiento Híbrido:                                            |
|      * Base de Datos: Metadatos livianos y rutas relativas            |
|      * Sistema de Archivos / Disco: Archivos binarios (.pdf, .jpg)    |
+-----------------------------------------------------------------------+
```

---

## 3. Principios Fundamentales y Reglas de Negocio

### 3.1. Restricción Estricta de Descarga de Libros
* **Regla de Negocio:** La plataforma tiene como política institucional la lectura en línea exclusiva de los ejemplares para proteger los derechos de autor y evitar la redistribución no autorizada.
* **Prohibiciones de Implementación:**
  * No deben incluirse botones con atributos `download` ni leyendas que sugieran descarga física (por ejemplo: "Descargar", "Descargar PDF", "Guardar archivo").
  * No deben exponerse rutas públicas con intenciones de descarga de archivos.
* **Comportamiento en la Interfaz de Usuario:**
  * En todas las vistas (`libro.html`, `catalogo.html`, `descargas.html`, `admin.html`), la acción provista es "Leer en línea" o la apertura del visor embebido.
  * La sección históricamente denominada "Descargas" en el código fuente hace referencia semántica a "Lecturas Guardadas" en el perfil del usuario.

### 3.2. Cifrado y Ofuscación de Enlaces de Lectura
* **Carga en Memoria Mediante Blob URLs:**
  * Los documentos PDF nunca se vinculan directamente mediante la ruta física estática en el Document Object Model (DOM) de la vista (por ejemplo: `src="/libros/archivo.pdf"`).
  * El módulo de visualización (`libro.html`) efectúa una petición controlada vía `fetch()`, recibe el flujo de datos binarios, genera un objeto `Blob` en la memoria volátil del navegador y produce una URL efímera (`blob:http://...#toolbar=0&navpanes=0`).
  * Esta dirección temporal reside únicamente durante la sesión activa en el hilo de ejecución, no es reutilizable fuera del contexto del navegador y oculta las herramientas estándar de descarga del visor nativo.
* **Protección del Servidor ante Enlaces Directos:**
  * Si un usuario o agente externo intenta ingresar manualmente a la dirección estática de un archivo PDF en la barra de direcciones del navegador (por ejemplo: `http://servidor/libros/documento.pdf`), el middleware de Express inspecciona la cabecera `sec-fetch-dest`. Al detectar navegación directa a nivel de documento, ejecuta una redirección automática hacia `/catalogo.html`.

### 3.3. Preservación de la Experiencia de Usuario y Usabilidad del Navegador
* **Directriz Técnica:** No deben aplicarse scripts invasivos que bloqueen el menú contextual (`oncontextmenu="return false;"`) ni que capturen y anulen atajos globales de teclado (`Ctrl+S`, `Ctrl+P`, `Ctrl+U`).
* **Justificación:** Los bloqueos de teclado y ratón deterioran la accesibilidad y causan fricción injustificada en el usuario sin aportar seguridad real. La protección del catálogo descansa en la arquitectura de entrega (Blob en memoria y redirección del servidor).

### 3.4. Almacenamiento Liviano en Base de Datos
* **Directriz Técnica:** Está terminantemente prohibido almacenar archivos binarios o codificaciones extensas en Base64 dentro de las tablas de CockroachDB / PostgreSQL.
* **Esquema de Almacenamiento:**
  * Los archivos PDF y las portadas se conservan en el almacenamiento en disco del servidor o en un servicio de almacenamiento de objetos en rutas dedicadas (`/libros/` e `/img/`).
  * La base de datos almacena exclusivamente una cadena de texto corta con la ruta relativa del archivo.
  * Esta estrategia preserva el rendimiento de las consultas SQL en tiempos inferiores a 10 milisegundos y evita el consumo desmedido de ancho de banda y memoria del motor de datos.

### 3.5. Rendimiento y Estrategia de Caché
* **Estrategia Stale-While-Revalidate (SWR):**
  * Las vistas públicas y administrativas cargan de forma inmediata los datos persistidos en `sessionStorage` o `localStorage`, reduciendo la percepción de latencia a 0 ms.
  * De forma asíncrona, el cliente consulta la versión actualizada al backend y actualiza la vista únicamente si detecta discrepancias en los datos.
* **Caché en Memoria Volátil del Backend:**
  * Endpoints de alta concurrencia (tales como `/api/libros`, `/api/ranking` y `/api/stats`) implementan almacenamiento en memoria con tiempo de vida (TTL) configurable, absorbiendo picos de tráfico y preservando el pool de conexiones de la base de datos.

### 3.6. Control de Acceso Basado en Roles (RBAC) y Seguridad
* **Jerarquía de Roles:**
  * `alumno`: Consulta de catálogo, lectura de libros, guardado en lista personal, reporte de consultas.
  * `profesor`: Mismas facultades de alumno con acceso ampliado a materiales docentes.
  * `preceptor`: Supervisión de usuarios y métricas de acceso.
  * `admin` / `administrador`: Control total del sistema (gestión de catálogo, alta/baja/modificación de usuarios, actualización de rankings, estadísticas globales y configuración institucional).
* **Prohibición de Credenciales o Correos Hardcodeados:**
  * No deben existir comprobaciones que comparen contra listas estáticas de correos electrónicos en el código fuente.
  * Toda autorización se deriva de la sesión autenticada en la base de datos y se transmite mediante cabeceras controladas (`x-user-email` y `x-user-rol`).

### 3.7. Identidad Visual e Iconografía
* **Selector de Tema (Modo Claro / Oscuro):**
  * Centralizado en `js/icons.js` a través de la función `setupThemeToggle()`.
  * Utiliza Morphicons SVG para transicionar de forma fluida de sol a luna mediante interpolación vectorial, evitando la inserción destructiva de iconos HTML estáticos.
* **Insignia Institucional:**
  * El escudo oficial de la institución educativa debe presentarse como un elemento circular perfecto en todas las vistas, con fondo blanco sólido (`background: #FFFFFF !important;`), borde institucional y sombra suave para garantizar legibilidad independientemente del tema visual activo.
