# Especificación de la Base de Datos - DigiTeca

La persistencia de datos de DigiTeca está implementada sobre CockroachDB Serverless, un motor de base de datos SQL distribuido con compatibilidad nativa con el protocolo de PostgreSQL.

---

## 1. Arquitectura de Conectividad y Resiliencia

El conector de base de datos se encuentra centralizado en `db/connection.js`, utilizando el controlador oficial `pg` (Node-Postgres).

### 1.1. Gestión de Pool de Conexiones
* **Capacidad máxima del pool (`max`):** 20 conexiones simultáneas.
* **Tiempo de inactividad permitido (`idleTimeoutMillis`):** 30.000 ms (30 segundos).
* **Tiempo de espera de conexión (`connectionTimeoutMillis`):** 30.000 ms (30 segundos). Este valor extendido está diseñado específicamente para absorber los tiempos de reactivación tras inactividad (*cold starts*) propios de la arquitectura Serverless de CockroachDB Cloud.
* **Mantenimiento de sesión activa (`keepAlive`):** Habilitado con retardo inicial de 10.000 ms.

### 1.2. Tolerancia a Fallos y Mecanismo de Reintentos
Las instancias serverless pueden suspender conexiones inactivas. La función `query(text, params, retries = 2)` evalúa automáticamente excepciones de red transitorias (`timeout`, `terminated unexpectedly`, `ECONNRESET`, `ETIMEDOUT`) y ejecuta hasta dos reintentos con retroceso exponencial (`1500ms * intento`) antes de elevar un error fatal.

### 1.3. Certificados de Seguridad SSL/TLS
Para entornos en la nube con `sslmode=verify-full`, el sistema busca de forma automática el certificado raíz de la autoridad certificadora (`root.crt`) en las ubicaciones estándar del sistema operativo:
* Windows: `%APPDATA%\postgresql\root.crt`
* Linux / macOS: `~/.postgresql/root.crt`
* Directorio local de la aplicación: `./root.crt`

---

## 2. Diagrama Entidad-Relación

```
  +-------------------------+             +-------------------------+
  |        usuarios         |             |         libros          |
  +-------------------------+             +-------------------------+
  | id (PK)                 |             | id (PK)                 |
  | email (UQ)              |<----+       | titulo                  |<----+
  | password                |     |       | autor                   |     |
  | nombre                  |     |       | materia                 |     |
  | apellido                |     |       | tipo                    |     |
  | rol                     |     |       | anios (JSONB)           |     |
  | anio                    |     |       | divisiones (JSONB)      |     |
  | estado                  |     |       | portada_url             |     |
  | avatar                  |     |       | pdf_url                 |     |
  | creado_en               |     |       | emoji                   |     |
  +-------------------------+     |       | categoria_c             |     |
                                  |       | categoria_l             |     |
  +-------------------------+     |       | descripcion             |     |
  |        descargas        |     |       | subido_por              |     |
  |   (Lecturas Guardadas)  |     |       | creado_en               |     |
  +-------------------------+     |       +-------------------------+     |
  | id (PK)                 |     |                    |                  |
  | usuario_email           |-----+                    |                  |
  | libro_id (FK)           |--------------------------+                  |
  | fecha_guardado          |                                             |
  +-------------------------+                                             |
                                                                          |
  +-------------------------+                                             |
  |    ranking_buscados     |                                             |
  +-------------------------+                                             |
  | posicion (PK)           |                                             |
  | libro_id (FK)           |---------------------------------------------+
  +-------------------------+

  +-------------------------+             +-------------------------+
  |   estadisticas_eventos  |             |    mensajes_contacto    |
  +-------------------------+             +-------------------------+
  | id (PK)                 |             | id (PK)                 |
  | tipo                    |             | nombre                  |
  | referencia_id           |             | email                   |
  | usuario_email           |             | rol                     |
  | usuario_nombre          |             | asunto                  |
  | usuario_rol             |             | mensaje                 |
  | dia_semana              |             | leido                   |
  | anio_cursada            |             | fecha                   |
  | fecha                   |             +-------------------------+
  +-------------------------+

  +-------------------------+
  |     sistema_config      |
  +-------------------------+
  | clave (PK)              |
  | valor                   |
  | actualizado_en          |
  +-------------------------+
```

---

## 3. Diccionario de Datos

### 3.1. Tabla `usuarios`
Registra las cuentas de acceso de la comunidad educativa.

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Identificador numérico único autoincremental |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Correo institucional del usuario |
| `password` | VARCHAR(255) | NOT NULL | Contraseña de autenticación |
| `nombre` | VARCHAR(100) | NOT NULL | Nombre de pila |
| `apellido` | VARCHAR(100) | NOT NULL | Apellido |
| `rol` | VARCHAR(30) | NOT NULL, DEFAULT 'alumno' | Rol de permisos: `alumno`, `profesor`, `preceptor`, `admin` |
| `anio` | VARCHAR(20) | DEFAULT 'Otro' | Año de cursada escolar (`1` a `6`, o `Otro`) |
| `estado` | VARCHAR(20) | DEFAULT 'activo' | Estado operativo de la cuenta: `activo` o `restringido` |
| `avatar` | TEXT | NULL | Ruta a la imagen de perfil o cadena de imagen |
| `creado_en` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Fecha y hora de creación de la cuenta |

### 3.2. Tabla `libros`
Almacena el catálogo bibliográfico institucional.

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Identificador único del ejemplar |
| `titulo` | VARCHAR(255) | NOT NULL | Título de la obra o documento |
| `autor` | VARCHAR(255) | NOT NULL | Autor o autores de la obra |
| `materia` | VARCHAR(100) | NOT NULL | Materia o área del conocimiento |
| `tipo` | VARCHAR(50) | DEFAULT 'Libro' | Tipo de documento (`Libro`, `Apunte`, `Guía`) |
| `anios` | JSONB | DEFAULT '[]'::jsonb | Años escolares a los que va dirigido (ej: `[4, 5]`) |
| `divisiones` | JSONB | DEFAULT '[]'::jsonb | Divisiones o especialidades escolares vinculadas |
| `portada_url` | TEXT | NULL | Ruta relativa o URL a la imagen de carátula |
| `pdf_url` | TEXT | NULL | Ruta relativa al archivo físico o enlace de streaming |
| `emoji` | VARCHAR(10) | DEFAULT '' | Glifo o identificador visual complementario |
| `categoria_c` | VARCHAR(100) | NULL | Identificador normalizado para filtros CSS/JS |
| `categoria_l` | VARCHAR(100) | NULL | Etiqueta visible de la categoría |
| `descripcion` | TEXT | NULL | Sinopsis o descripción del contenido temático |
| `subido_por` | VARCHAR(255) | NULL | Identificador o correo del usuario que cargó el libro |
| `creado_en` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Fecha y hora de alta en el sistema |

### 3.3. Tabla `ranking_buscados`
Mantiene la lista fija u ordenada del Top de libros recomendados y destacados.

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `posicion` | INT | PRIMARY KEY | Número de orden en el ranking (1 a N) |
| `libro_id` | INT | NOT NULL, REFERENCES libros(id) ON DELETE CASCADE | Clave foránea al libro destacado |

### 3.4. Tabla `descargas` (Lecturas Guardadas)
Gestiona la biblioteca personal y marcadores de cada usuario.

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Identificador del marcador |
| `usuario_email` | VARCHAR(255) | NOT NULL | Correo electrónico del usuario |
| `libro_id` | INT | NOT NULL, REFERENCES libros(id) ON DELETE CASCADE | Clave foránea al ejemplar guardado |
| `fecha_guardado` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Momento exacto en que fue añadido a la lista |

### 3.5. Tabla `estadisticas_eventos`
Registro consolidado de eventos del sistema para auditoría y visualización analítica.

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Identificador secuencial del evento |
| `tipo` | VARCHAR(50) | NOT NULL | Tipo de evento: `visita`, `ingreso`, `libro_abierto`, `lectura` |
| `referencia_id` | INT | NULL | Identificador de recurso vinculado (ej: `libro_id`) |
| `usuario_email` | VARCHAR(255) | NULL | Correo del usuario actuante (si aplica) |
| `usuario_nombre` | VARCHAR(255) | NULL | Nombre completo del usuario actuante |
| `usuario_rol` | VARCHAR(50) | NULL | Rol del usuario en el momento de la acción |
| `dia_semana` | INT | NULL | Día de la semana (0 = Domingo, 6 = Sábado) |
| `anio_cursada` | VARCHAR(20) | NULL | Año de cursada del usuario en el evento |
| `fecha` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Marca de tiempo precisa del evento |

### 3.6. Tabla `mensajes_contacto`
Buzón institucional para recepción de consultas técnicas y solicitudes de material bibliográfico.

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Identificador del mensaje |
| `nombre` | VARCHAR(100) | NOT NULL | Nombre de la persona remitente |
| `email` | VARCHAR(255) | NOT NULL | Dirección de respuesta |
| `rol` | VARCHAR(50) | NULL | Rol institucional del remitente |
| `asunto` | VARCHAR(255) | NULL | Título o motivo del contacto |
| `mensaje` | TEXT | NOT NULL | Cuerpo completo del mensaje |
| `leido` | BOOLEAN | DEFAULT FALSE | Estado de lectura por parte de la administración |
| `fecha` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Fecha de recepción |

### 3.7. Tabla `sistema_config`
Almacenamiento de pares clave-valor para banderas del sistema y control de migraciones.

| Campo | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `clave` | VARCHAR(100) | PRIMARY KEY | Identificador de configuración (ej: `seed_libros_completado`) |
| `valor` | VARCHAR(255) | NOT NULL | Valor asignado a la configuración |
| `actualizado_en` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Última fecha de modificación |

---

## 4. Proceso de Inicialización y Poblado de Datos (Seed)

El script `db/seed.js` se invoca de manera automática al inicializar el servidor (`npm start` o `npm run dev`):
1. **Verificación de DDL:** Lee `db/init.sql` y aplica la creación condicional (`CREATE TABLE IF NOT EXISTS`) de todas las tablas requeridas.
2. **Control de Duplicación:** Consulta la clave `seed_libros_completado` en la tabla `sistema_config`. Si su valor es `true`, omite la inserción masiva de libros predeterminados, preservando los registros existentes y evitando la sobreescritura de datos productivos.
3. **Cuentas Administrativas Iniciales:** Aplica una instrucción `ON CONFLICT (email) DO UPDATE` para mantener actualizados los perfiles de gestión preconfigurados sin duplicar filas.
