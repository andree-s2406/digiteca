# DigiTeca - Sistema de Biblioteca Digital

Plataforma institucional de gestión y lectura bibliográfica digital para la comunidad educativa de la **Escuela Técnica N° 29 D.E. 6 "Reconquista de Buenos Aires"**.

---

## 1. Descripción del Proyecto

DigiTeca es una solución web orientada a la democratización del acceso al material bibliográfico, técnico y pedagógico de la institución. Permite a estudiantes, docentes y directivos consultar el catálogo de obras, previsualizar y realizar lecturas completas en línea mediante un visor integrado, gestionar listas personales de estudio y consultar estadísticas de uso del sistema.

El sistema está diseñado priorizando la velocidad de respuesta, el uso eficiente de almacenamiento en base de datos, la seguridad en la protección de contenidos protegidos y una navegación accesible sin fricción.

---

## 2. Pila Tecnológica

### 2.1. Frontend
* **Estructura y Estilos:** HTML5 semántico y CSS3 con variables de diseño para soporte nativo de modo claro y oscuro.
* **Lenguaje:** Vanilla JavaScript modular (ES6+), prescindiendo de dependencias de frameworks externos para maximizar el rendimiento y reducir la sobrecarga de descarga.
* **Visor de Documentos:** PDF.js con ofuscación en memoria mediante Blob URLs.
* **Iconografía e Interacciones:** Morphicons (animaciones vectoriales SVG para transiciones fluidas de tema) y Lucide Icons.
* **Sincronización en Tiempo Real:** Cliente Pusher WebSockets integrado con la API nativa `BroadcastChannel` para comunicación local entre pestañas.

### 2.2. Backend
* **Entorno de Ejecución:** Node.js (v18+ / v20 LTS).
* **Framework Web:** Express.js (v4).
* **Seguridad y Rendimiento:** Compresión GZIP (`compression`), Rate Limiting para mitigación de fuerza bruta en autenticación, cabeceras de seguridad HTTP (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`) y middleware de Control de Acceso Basado en Roles (RBAC).
* **Gestión de Archivos:** Multer para la recepción y almacenamiento ordenado de documentos PDF e imágenes de portada en disco.
* **Notificaciones Push:** Pusher Server SDK para la propagación de eventos en tiempo real.

### 2.3. Persistencia de Datos
* **Motor:** CockroachDB Serverless / PostgreSQL.
* **Conector:** Driver oficial `pg` (Node-Postgres) con pool de conexiones resistente a arranques en frío (*cold starts*) y reintentos automáticos.
* **Estrategia Híbrida:** Metadatos estructurados en base de datos relacional y archivos binarios pesados conservados en el sistema de archivos del servidor.

---

## 3. Estructura del Repositorio

```
digiteca-nueva/
├── css/                     # Hojas de estilo globales, temas y componentes
├── data/                    # Respaldos y catálogo inicial de datos en JSON
├── db/                      # Conectividad y esquemas de base de datos
│   ├── connection.js        # Pool de conexiones, soporte SSL y reintentos SQL
│   ├── init.sql             # Definición de tablas y restricciones (DDL)
│   └── seed.js              # Script de inicialización y migración de datos
├── docs/                    # Documentación técnica formal del sistema
│   ├── API.md               # Especificación completa de endpoints REST
│   ├── ARQUITECTURA.md      # Directrices de diseño y reglas de negocio
│   ├── BASE_DE_DATOS.md     # Diccionario de datos y modelo relacional
│   ├── DESPLIEGUE.md        # Manual de instalación y puesta en producción
│   ├── MANUAL_DE_USUARIO.md # Manual de usuario y guía de operación en Markdown
│   └── MANUAL_DE_USUARIO.pdf# Manual de usuario en formato PDF imprimible oficial
├── favicon/                 # Recursos gráficos de icono para navegadores
├── img/                     # Recursos gráficos, portadas e insignias
├── js/                      # Lógica de cliente en JavaScript modular
│   ├── api.js               # Cliente de consumo para la API REST
│   ├── icons.js             # Controlador de temas e iconografía SVG
│   ├── motion.js            # Micro-animaciones e interacciones de interfaz
│   ├── quick-nav.js         # Módulo de navegación contextual rápida
│   └── sync.js              # Administrador de sincronización en tiempo real
├── routes/                  # Controladores de rutas de la API REST
│   ├── auth.js              # Autenticación y recuperación de contraseñas
│   ├── contacto.js          # Formulario de consultas institucionales
│   ├── descargas.js         # Gestión de lecturas guardadas en perfil
│   ├── libros.js            # Catálogo bibliográfico y transmisión de PDF
│   ├── ranking.js           # Estadísticas de libros destacados
│   ├── stats.js             # Analítica institucional y métricas de panel
│   ├── sync.js              # Endpoint de versión y configuración push
│   ├── upload.js            # Subida de archivos binarios (PDF e imágenes)
│   └── usuarios.js          # Administración de cuentas de usuario
├── services/                # Servicios auxiliares de backend
│   └── sync.js              # Servicio de emisión de eventos con Pusher
├── .env.example             # Plantilla de variables de entorno requeridas
├── .gitignore               # Exclusión de archivos para control de versiones
├── admin.html               # Panel administrativo institucional
├── catalogo.html            # Catálogo general con buscador y filtros
├── descargas.html           # Biblioteca de lecturas guardadas del usuario
├── index.html               # Portal principal de acceso y bienvenida
├── libro.html               # Visor interactivo seguro de lectura en línea
├── login.html               # Inicio de sesión y restablecimiento de cuenta
├── micuenta.html            # Perfil personal y configuración de usuario
├── package.json             # Manifiesto del proyecto y dependencias de Node
├── PUNTOS_IMPORTANTES.md    # Resumen de reglas fundamentales del sistema
├── render.yaml              # Manifiesto de infraestructura como código (Render)
└── server.js                # Punto de entrada principal del servidor Express
```

---

## 4. Requisitos del Sistema y Variables de Entorno

### 4.1. Requisitos Previos
* Node.js v18.0.0 o superior.
* npm v9.0.0 o superior.
* Instancia de CockroachDB (local o cuenta en CockroachDB Cloud Serverless).

### 4.2. Configuración del Archivo `.env`
Crear el archivo `.env` en la raíz del proyecto tomando como base `.env.example`:

| Variable | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `PORT` | Numérico | Opcional | Puerto de escucha HTTP (por defecto: `3000`) |
| `DATABASE_URL` | Cadena | Sí | Cadena de conexión JDBC/PostgreSQL a CockroachDB |
| `PUSHER_APP_ID` | Cadena | Opcional | Identificador de aplicación para Pusher Channels |
| `PUSHER_KEY` | Cadena | Opcional | Clave pública para cliente de Pusher |
| `PUSHER_SECRET` | Cadena | Opcional | Clave privada de autenticación en Pusher |
| `PUSHER_CLUSTER` | Cadena | Opcional | Región del cluster de Pusher (por ejemplo: `us2`) |
| `DEBUG_SQL` | Booleano | Opcional | Si es `true`, imprime las consultas SQL en consola |

---

## 5. Instalación y Puesta en Marcha

1. **Instalación de paquetes de dependencias:**
   ```bash
   npm install
   ```

2. **Inicialización de la base de datos:**
   ```bash
   npm run seed
   ```
   *Crea las tablas especificadas en `db/init.sql` y verifica el estado de inicialización.*

3. **Ejecución en modo de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Ejecución en modo de producción:**
   ```bash
   npm start
   ```

El servicio estará disponible en el puerto configurado (predeterminado: `http://localhost:3000`).

---

## 6. Políticas de Seguridad y Arquitectura de Contenidos

1. **Prohibición Estricta de Descarga de Archivos:**
   El sistema no proporciona enlaces con atributos `download` ni opciones para guardar copias locales de los libros. La única modalidad permitida es la lectura en línea.
2. **Carga Segura Mediante Blob URLs:**
   El visor integrado (`libro.html`) descarga los bytes del PDF en un `Blob` temporal en la memoria del navegador (`blob:http://...#toolbar=0&navpanes=0`), impidiendo la exposición de la ruta real del archivo e inhabilitando las barras nativas de guardado del navegador.
3. **Protección Contra Enlaces Directos:**
   El servidor intercepta peticiones directas de tipo documento a la carpeta `/libros/*.pdf` y las redirige inmediatamente a `/catalogo.html`.
4. **Control de Acceso Basado en Roles (RBAC):**
   Las rutas protegidas del panel administrativo y las mutaciones de datos validan el rol institucional del usuario (`admin`, `preceptor`, `profesor` o `alumno`). No se admiten comprobaciones basadas en correos hardcodeados.

---

## 7. Módulos de la API REST

| Módulo | Ruta Base | Métodos | Descripción |
| :--- | :--- | :--- | :--- |
| Salud | `/api/health` | GET | Comprobación de conectividad y estado del servidor |
| Autenticación | `/api/auth` | POST | Inicio de sesión y solicitud de restablecimiento |
| Catálogo | `/api/libros` | GET, POST, PUT, DELETE | Consulta filtrada, streaming de PDF y CRUD de obras |
| Usuarios | `/api/usuarios` | GET, POST, PUT, PATCH, DELETE | Gestión de perfiles institucionales y roles |
| Lecturas Guardadas | `/api/descargas` | GET, POST, DELETE | Marcadores y biblioteca personal del estudiante |
| Estadísticas | `/api/stats` | GET, POST | Métricas agregadas de uso y generación de balances |
| Ranking | `/api/ranking` | GET, PUT | Consulta y ordenamiento de obras destacadas |
| Carga de Archivos | `/api/upload` | POST | Subida de documentos PDF y carátulas de libros |
| Contacto | `/api/contacto` | GET, POST, PATCH | Buzón institucional de mensajes y solicitudes |
| Sincronización | `/api/sync` | GET | Consulta de versiones y parámetros de WebSockets |

---

## 8. Documentación Detallada

Para consultar las especificaciones técnicas completas del proyecto, diríjase a los documentos correspondientes en el directorio `docs/`:

* **[Manual de Usuario y Guía de Operación (PDF)](docs/MANUAL_DE_USUARIO.pdf):** Documento oficial imprimible con portadas, índice y guía completa para alumnos, docentes y administradores.
* **[Manual de Usuario en Markdown](docs/MANUAL_DE_USUARIO.md):** Versión en texto plano estructurado del manual de usuario para lectura en el repositorio.
* **[Arquitectura y Directrices Técnicas](docs/ARQUITECTURA.md):** Fundamentos de diseño, seguridad en lectura, jerarquía de roles RBAC e identidad visual.
* **[Referencia Completa de la API](docs/API.md):** Contratos de petición y respuesta, parámetros de consulta, códigos de error y cabeceras.
* **[Especificación de Base de Datos](docs/BASE_DE_DATOS.md):** Diagrama entidad-relación, diccionario de campos y gestión de pool de conexiones.
* **[Guía de Despliegue y Operación](docs/DESPLIEGUE.md):** Procedimiento para despliegue en Render, integración con CockroachDB Cloud y solución de incidencias.
