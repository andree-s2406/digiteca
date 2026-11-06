# Referencia de la API REST - DigiTeca

La API REST de DigiTeca proporciona los servicios de backend para la consulta bibliográfica, gestión de cuentas de usuario, métricas institucionales, subida de contenidos y sincronización en tiempo real.

---

## 1. Convenciones Generales

### 1.1. Dirección Base
* Entorno de desarrollo: `http://localhost:3000/api`
* Entorno de producción: `https://<dominio-produccion>/api`

### 1.2. Cabeceras de Solicitud
* `Content-Type: application/json` (Requerido para cuerpos de solicitud en formato JSON).
* `x-user-email`: Correo electrónico del usuario en sesión activa. Requerido para operaciones autenticadas.
* `x-user-rol`: Rol del usuario (`alumno`, `profesor`, `preceptor`, `admin`, `administrador`). Evaluado por el middleware `apiAuthGuard` para el control de acceso basado en roles.

### 1.3. Limitación de Tasa (Rate Limiting)
* El endpoint de inicio de sesión (`/api/auth/login`) posee un límite de 15 solicitudes por minuto por dirección IP. Al exceder este umbral, el servidor responderá con código `429 Too Many Requests`.

### 1.4. Códigos de Estado HTTP
* `200 OK`: Petición procesada con éxito.
* `201 Created`: Recurso creado exitosamente.
* `304 Not Modified`: El recurso no ha cambiado (validación por ETag).
* `400 Bad Request`: Datos de solicitud faltantes o con formato inválido.
* `401 Unauthorized`: Se requiere autenticación para acceder al recurso.
* `403 Forbidden`: El usuario no posee privilegios suficientes.
* `404 Not Found`: El recurso solicitado no existe.
* `429 Too Many Requests`: Se excedió el límite de peticiones permitido.
* `500 Internal Server Error`: Falla no controlada en el servidor.

---

## 2. Módulo de Estado (Health Check)

### GET `/api/health`
Retorna el estado operativo del servicio y la conexión a la base de datos.

* **Nivel de acceso:** Público.
* **Respuesta exitosa (200 OK):**
```json
{
  "status": "online",
  "database": "CockroachDB",
  "timestamp": "2026-11-06T20:30:00.000Z"
}
```

---

## 3. Módulo de Autenticación

### POST `/api/auth/login`
Autentica las credenciales de un usuario y registra el evento de inicio de sesión para las estadísticas institucionales.

* **Nivel de acceso:** Público (protegido por Rate Limiter).
* **Cuerpo de la solicitud (JSON):**
```json
{
  "email": "usuario@escuela29.edu.ar",
  "password": "contrasenia_plana"
}
```
* **Respuesta exitosa (200 OK):**
```json
{
  "message": "Inicio de sesión exitoso",
  "user": {
    "id": 1,
    "email": "usuario@escuela29.edu.ar",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rol": "alumno",
    "anio": "3",
    "estado": "activo",
    "avatar": null
  }
}
```
* **Respuestas de error:**
  * `400 Bad Request`: Si falta el correo o la contraseña.
  * `401 Unauthorized`: Credenciales erróneas o usuario inexistente.
  * `403 Forbidden`: Si el estado de la cuenta es `restringido`.

### POST `/api/auth/reset-password`
Solicita el restablecimiento de credenciales para un correo electrónico.

* **Nivel de acceso:** Público.
* **Cuerpo de la solicitud (JSON):**
```json
{
  "email": "usuario@escuela29.edu.ar"
}
```
* **Respuesta exitosa (200 OK):**
```json
{
  "message": "Si el correo está registrado, se enviaron las instrucciones para restablecer la contraseña."
}
```

---

## 4. Módulo de Libros y Catálogo

### GET `/api/libros`
Obtiene el listado de libros registrados, con soporte para filtros de búsqueda.

* **Nivel de acceso:** Público.
* **Parámetros de consulta (Query Parameters):**
  * `q` (opcional): Término de búsqueda textual (título, autor, materia o descripción).
  * `materia` (opcional): Filtro por materia curricular.
  * `tipo` (opcional): Tipo de publicación (`Libro`, `Apunte`, `Guía`).
  * `anio` (opcional): Año escolar (`1` a `6`, o `otros`).
* **Respuesta exitosa (200 OK):**
```json
[
  {
    "id": 12,
    "t": "Física I: Mecánica y Termodinámica",
    "titulo": "Física I: Mecánica y Termodinámica",
    "a": "Resnick, Halliday & Krane",
    "autor": "Resnick, Halliday & Krane",
    "mat": "Física",
    "materia": "Física",
    "tipo": "Libro",
    "anios": [4, 5],
    "divisiones": [],
    "img": "img/portada_fisica_1.jpg",
    "portada_url": "img/portada_fisica_1.jpg",
    "pdf": "libros/fisica_mecanica.pdf",
    "pdf_url": "libros/fisica_mecanica.pdf",
    "hasPdf": true,
    "e": "",
    "emoji": "",
    "c": "fisica",
    "categoria_c": "fisica",
    "l": "Física",
    "categoria_l": "Física",
    "descripcion": "Fundamentos teóricos de cinemática y dinámica aplicada.",
    "subioPor": "admin",
    "subido_por": "admin"
  }
]
```

### GET `/api/libros/:id`
Retorna el detalle completo de un ejemplar específico por su identificador.

* **Nivel de acceso:** Público.
* **Respuesta exitosa (200 OK):** Objeto JSON correspondiente al libro consultado.
* **Error (404 Not Found):** Si el identificador no existe en la base de datos.

### GET `/api/libros/:id/pdf`
Transmite el flujo binario del documento PDF con soporte para solicitudes parciales de rango (`Range Requests`).

* **Nivel de acceso:** Público.
* **Cabeceras de respuesta:**
  * `Content-Type: application/pdf`
  * `Content-Disposition: inline; filename="titulo.pdf"`
  * `Accept-Ranges: bytes`

### POST `/api/libros`
Registra un nuevo ejemplar en el catálogo bibliográfico.

* **Nivel de acceso:** Restringido (`admin`, `administrador`, `preceptor`, `profesor`).
* **Cuerpo de la solicitud (JSON):**
```json
{
  "t": "Análisis Matemático",
  "a": "Rey Pastor",
  "mat": "Matemática",
  "tipo": "Libro",
  "anios": [4, 5, 6],
  "divisiones": [],
  "img": "img/portada_analisis.jpg",
  "pdf": "libros/analisis_matematico.pdf",
  "descripcion": "Manual de cálculo diferencial e integral.",
  "subioPor": "coordinacion_academica"
}
```
* **Respuesta exitosa (201 Created):** Objeto del libro creado con su identificador generado.

### PUT `/api/libros/:id`
Actualiza la información de un libro existente.

* **Nivel de acceso:** Restringido (`admin`, `administrador`, `preceptor`, `profesor`).
* **Cuerpo de la solicitud (JSON):** Mismo esquema que en la creación.
* **Respuesta exitosa (200 OK):** Objeto del libro modificado.

### DELETE `/api/libros/:id`
Elimina un libro del catálogo y su referencia en rankings y lecturas guardadas en cascada.

* **Nivel de acceso:** Restringido (`admin`, `administrador`, `preceptor`, `profesor`).
* **Respuesta exitosa (200 OK):**
```json
{
  "message": "Libro eliminado exitosamente",
  "id": 12
}
```

---

## 5. Módulo de Usuarios

### GET `/api/usuarios/me`
Retorna los datos de perfil del usuario que realiza la petición.

* **Nivel de acceso:** Autenticado (requiere cabecera `x-user-email`).
* **Respuesta exitosa (200 OK):**
```json
{
  "id": "15",
  "email": "estudiante@escuela29.edu.ar",
  "nombre": "Martín",
  "apellido": "González",
  "rol": "alumno",
  "anio": "4",
  "estado": "activo",
  "avatar": null,
  "creado_en": "2026-03-01T12:00:00.000Z"
}
```

### GET `/api/usuarios`
Retorna el listado completo de usuarios registrados. Incorpora validación de caché ETag basada en la versión del módulo.

* **Nivel de acceso:** Restringido a personal administrativo.
* **Cabecera de respuesta:** `ETag: "usr-<version>"`
* **Respuesta condicional (304 Not Modified):** Si la cabecera `If-None-Match` coincide con la versión actual en memoria.
* **Respuesta exitosa (200 OK):** Matriz de objetos con información de usuarios.

### POST `/api/usuarios`
Crea una nueva cuenta de usuario en el sistema.

* **Nivel de acceso:** Restringido a personal administrativo.
* **Cuerpo de la solicitud (JSON):**
```json
{
  "email": "docente.quimica@escuela29.edu.ar",
  "password": "clave_segura",
  "nombre": "Silvia",
  "apellido": "Alonso",
  "rol": "profesor",
  "anio": "5",
  "estado": "activo"
}
```
* **Respuesta exitosa (201 Created):**
```json
{
  "message": "Usuario creado exitosamente",
  "user": {
    "id": 48,
    "email": "docente.quimica@escuela29.edu.ar",
    "nombre": "Silvia",
    "apellido": "Alonso",
    "rol": "profesor",
    "anio": "5",
    "estado": "activo"
  }
}
```

### PUT `/api/usuarios/:id`
Modifica los datos personales o credenciales de un usuario.

* **Nivel de acceso:** Personal administrativo o el propio usuario autenticado.
* **Cuerpo de la solicitud (JSON):** Parámetros editables (`nombre`, `apellido`, `email`, `password`, `rol`, `anio`, `estado`, `avatar`).

### PATCH `/api/usuarios/:id/estado`
Cambia el estado de una cuenta (`activo` o `restringido`).

* **Nivel de acceso:** Personal administrativo.
* **Cuerpo de la solicitud (JSON):** `{"estado": "restringido"}`

### DELETE `/api/usuarios/:id`
Da de baja una cuenta de usuario en el sistema.

* **Nivel de acceso:** Personal administrativo.

---

## 6. Módulo de Lecturas Guardadas ("Descargas")

> Nota técnica: El término histórico "descargas" en los identificadores de rutas y tablas hace referencia semántica estricta al guardado de marcadores de libros en la biblioteca personal del usuario para lectura posterior, no a la descarga física del archivo.

### GET `/api/descargas`
Lista los libros guardados por un usuario específico.

* **Nivel de acceso:** Autenticado.
* **Parámetros de consulta:** `email=usuario@escuela29.edu.ar`
* **Respuesta exitosa (200 OK):** Matriz de libros asociados al usuario con fecha de guardado.

### POST `/api/descargas`
Agrega un libro a la lista de guardados del usuario, evitando registros duplicados.

* **Nivel de acceso:** Autenticado.
* **Cuerpo de la solicitud (JSON):**
```json
{
  "email": "usuario@escuela29.edu.ar",
  "libroId": 12
}
```

### DELETE `/api/descargas/:id`
Remueve un libro de la lista personal del usuario.

* **Nivel de acceso:** Autenticado (el usuario propietario del registro).

---

## 7. Módulo de Estadísticas y Analítica

### GET `/api/stats`
Calcula los indicadores institucionales consolidados para el panel de administración. Cuenta con caché en memoria con TTL de 20 segundos.

* **Nivel de acceso:** Restringido a personal administrativo.
* **Parámetros de consulta:**
  * `periodo`: `todo`, `24h`, `semana`, `mes`, `anio` o `custom`.
  * `desde` y `hasta`: Fechas en formato ISO (requeridas si `periodo=custom`).
  * `nocache`: Si es `true`, fuerza el cálculo directo en la base de datos sin leer memoria RAM.
* **Respuesta exitosa (200 OK):**
```json
{
  "resumen": {
    "totalLibros": 184,
    "usuarios": {
      "total": 650,
      "activos": 642,
      "restringidos": 8,
      "admins": 5,
      "preceptores": 12,
      "profesores": 45,
      "alumnos": 588
    },
    "visitas": 14200,
    "librosAbiertos": 8430,
    "sesionesHoy": 145,
    "descargasTotales": 1230
  },
  "ingresosPorDia": [45, 120, 135, 110, 128, 98, 22],
  "ingresosPorAnio": {
    "1": 150, "2": 140, "3": 110, "4": 95, "5": 80, "6": 65, "Otro": 10
  },
  "topLibros": [],
  "ultimosIngresos": []
}
```

### POST `/api/stats/visita`
Registra un evento anónimo de visita a la plataforma.

* **Nivel de acceso:** Público.

### POST `/api/stats/libro-abierto`
Registra la apertura de un documento para lectura en el visor.

* **Nivel de acceso:** Público / Autenticado.
* **Cuerpo de la solicitud (JSON):**
```json
{
  "libroId": 12,
  "usuarioEmail": "estudiante@escuela29.edu.ar",
  "anio": "4"
}
```

### GET `/api/stats/reporte-texto`
Genera y descarga un archivo estructurado en texto plano con el balance de actividad institucional para un período específico.

* **Nivel de acceso:** Restringido a personal administrativo.
* **Cabecera de respuesta:** `Content-Type: text/plain; charset=utf-8`

---

## 8. Módulo de Ranking

### GET `/api/ranking`
Devuelve el Top 8 de ejemplares con mayor índice de lectura y consulta. Cuenta con almacenamiento en memoria con expiración a los 20 segundos.

* **Nivel de acceso:** Público.

### PUT `/api/ranking`
Establece de manera manual el orden de prioridades del ranking en la base de datos.

* **Nivel de acceso:** Restringido a personal administrativo.
* **Cuerpo de la solicitud (JSON):**
```json
{
  "ids": [12, 5, 23, 8, 19, 44, 2, 17]
}
```

---

## 9. Módulo de Subida de Archivos (Upload)

Procesa transferencias de archivos en formato `multipart/form-data` mediante Multer, aplicando filtros por extensión y tipo MIME.

### POST `/api/upload/pdf`
Carga un archivo de documento en el directorio físico del servidor `/libros`.

* **Nivel de acceso:** Restringido a personal administrativo.
* **Form-Data:** Campo `pdf` (Archivo binario, tamaño máximo 50 MB).
* **Respuesta exitosa (200 OK):**
```json
{
  "message": "PDF subido exitosamente",
  "url": "libros/fisica_mecanica_1741234567890.pdf",
  "filename": "fisica_mecanica_1741234567890.pdf",
  "size": 15420310
}
```

### POST `/api/upload/portada`
Carga una imagen de carátula en el directorio físico `/img`.

* **Nivel de acceso:** Restringido a personal administrativo.
* **Form-Data:** Campo `imagen` (Imágenes JPEG, PNG, WEBP, GIF, tamaño máximo 10 MB).
* **Respuesta exitosa (200 OK):**
```json
{
  "message": "Portada subida exitosamente",
  "url": "img/portada_fisica_1741234567890.jpg",
  "filename": "portada_fisica_1741234567890.jpg",
  "size": 320150
}
```

---

## 10. Módulo de Mensajes de Contacto

### POST `/api/contacto`
Registra un mensaje enviado a través del formulario de asistencia institucional.

* **Nivel de acceso:** Público.
* **Cuerpo de la solicitud (JSON):**
```json
{
  "nombre": "Clara Soria",
  "email": "csoria@escuela29.edu.ar",
  "rol": "profesor",
  "asunto": "Incorporación de material para 5to año",
  "mensaje": "Solicito agregar el compendio de normas técnicas IRAM al catálogo."
}
```

### GET `/api/contacto`
Lista todos los mensajes de contacto recibidos ordenados cronológicamente.

* **Nivel de acceso:** Restringido a personal administrativo.

### PATCH `/api/contacto/:id/leido`
Actualiza el estado de lectura de un mensaje específico.

* **Nivel de acceso:** Restringido a personal administrativo.
* **Cuerpo de la solicitud (JSON):** `{"leido": true}`

---

## 11. Módulo de Sincronización en Tiempo Real

### GET `/api/sync/config`
Provee las credenciales públicas para la inicialización del cliente de Pusher en el frontend.

* **Nivel de acceso:** Público.
* **Respuesta exitosa (200 OK):**
```json
{
  "enabled": true,
  "key": "214fc694ea6233c9ba09",
  "cluster": "us2",
  "channel": "digiteca-live"
}
```

### GET `/api/sync/version`
Consulta ultraliviana para verificación de marcas temporales de actualización por módulo, con soporte de validación ETag.

* **Nivel de acceso:** Público.
* **Respuesta condicional (304 Not Modified):** Si no ha habido modificaciones en ningún módulo desde la última consulta.
* **Respuesta exitosa (200 OK):**
```json
{
  "status": "ok",
  "versions": {
    "usuarios": 1741234567890,
    "libros": 1741234599990,
    "stats": 1741234588880,
    "ranking": 1741234500000
  }
}
```
