# Guía de Instalación, Configuración y Despliegue - DigiTeca

Este documento detalla los requerimientos, pasos de instalación para entornos de desarrollo local y procedimientos para el despliegue en plataformas en la nube (Render y CockroachDB Cloud).

---

## 1. Requisitos Previos del Sistema

* **Entorno de Ejecución:** Node.js versión 18.0.0 o superior (se recomienda Node.js 20 LTS).
* **Gestor de Paquetes:** npm versión 9.0.0 o superior.
* **Motor de Base de Datos:**
  * Instancia local de CockroachDB (versión v22+) o PostgreSQL (versión 14+), o bien:
  * Una cuenta activa en CockroachDB Cloud (modalidad Serverless).
* **Servicio de WebSockets (Opcional pero recomendado):**
  * Cuenta en Pusher Channels para la sincronización multi-dispositivo en tiempo real.

---

## 2. Variables de Entorno

El archivo `.env` en la raíz del proyecto define los parámetros de configuración en tiempo de ejecución. Puede utilizarse `.env.example` como plantilla base:

```ini
# Puerto de escucha del servidor HTTP
PORT=3000

# Cadena de conexión a CockroachDB o PostgreSQL
# Formato Local:
DATABASE_URL=postgresql://root@localhost:26257/digiteca?sslmode=disable

# Formato Cloud (ejemplo):
# DATABASE_URL=postgresql://usuario:clave@host-cluster.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full

# Credenciales de Pusher (Sincronización en Tiempo Real)
PUSHER_APP_ID=2194430
PUSHER_KEY=214fc694ea6233c9ba09
PUSHER_SECRET=tu_secreto_aqui
PUSHER_CLUSTER=us2

# Repositorio para entrega de contenidos (Opcional)
GITHUB_OWNER=andresrodriguez750-max
GITHUB_REPO=digiteca-libros
GITHUB_TOKEN=tu_token_aqui

# Habilitar depuración de consultas SQL en consola (true / false)
DEBUG_SQL=false
```

---

## 3. Instalación en Entorno Local

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/andresrodriguez750-max/digiteca-nueva.git
cd digiteca-nueva
```

### Paso 2: Instalar Dependencias
```bash
npm install
```

### Paso 3: Configurar el Archivo de Entorno
Copiar la plantilla de ejemplo y completar los valores correspondientes:
```bash
cp .env.example .env
```

### Paso 4: Inicializar la Base de Datos
El script de inicialización ejecuta automáticamente `db/init.sql` y puebla los datos básicos si la base está vacía. Para ejecutarlo de manera manual:
```bash
npm run seed
```

### Paso 5: Iniciar el Servidor de Desarrollo
* Con reinicio automático ante cambios en el código (Node.js nativo):
  ```bash
  npm run dev
  ```
* En modo producción estándar:
  ```bash
  npm start
  ```

El servidor estará accesible en: `http://localhost:3000`

---

## 4. Despliegue en Producción (Render)

El proyecto incluye el archivo declarativo `render.yaml` listo para despliegues automatizados mediante la función *Blueprint* de Render.

### 4.1. Configuración de `render.yaml`
```yaml
services:
  - type: web
    name: digiteca
    runtime: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: PUSHER_APP_ID
        value: "2194430"
      - key: PUSHER_KEY
        value: "214fc694ea6233c9ba09"
      - key: PUSHER_SECRET
        sync: false
      - key: PUSHER_CLUSTER
        value: "us2"
      - key: GITHUB_OWNER
        value: "andresrodriguez750-max"
      - key: GITHUB_REPO
        value: "digiteca-libros"
      - key: GITHUB_TOKEN
        sync: false
```

### 4.2. Procedimiento de Despliegue
1. Conectar el repositorio de GitHub con la cuenta de Render.
2. Crear un nuevo servicio de tipo **Web Service** o importar como **Blueprint**.
3. En la sección **Environment Variables** del panel de control de Render, suministrar los valores con `sync: false`:
   * `DATABASE_URL`: Cadena de conexión completa provista por CockroachDB Cloud.
   * `PUSHER_SECRET`: Secreto de la aplicación Pusher.
   * `GITHUB_TOKEN`: Token personal de acceso (si se utiliza distribución de archivos remota).
4. El proceso de construcción ejecutará `npm install` y posteriormente levantará el servicio con `npm start`.
5. Render verificará la salud de la aplicación consultando `/api/health`.

---

## 5. Configuración de CockroachDB Cloud

1. Iniciar sesión en [CockroachDB Cloud](https://cockroachlabs.cloud/).
2. Crear un cluster bajo el plan **Serverless** (gratuito).
3. Seleccionar la región más cercana geográficamente para reducir la latencia de red.
4. Generar un usuario SQL y contraseña segura.
5. Descargar el certificado raíz de la autoridad certificadora (`root.crt`).
   * En sistemas Windows: Almacenar en `%APPDATA%\postgresql\root.crt`.
   * En sistemas Linux/Render: Almacenar en `~/.postgresql/root.crt` o ubicarlo en la raíz del proyecto.
6. Copiar la cadena de conexión en formato `postgresql://...` y asignarla a la variable `DATABASE_URL`.

---

## 6. Sincronización en Tiempo Real (Pusher)

DigiTeca utiliza un modelo híbrido de sincronización:
1. **Canal Principal (Pusher):**
   * Emite el evento `data-changed` en el canal `digiteca-live` cada vez que se agrega, modifica o elimina un registro en los módulos de usuarios, libros, ranking o estadísticas.
   * Las sesiones abiertas en otros navegadores o dispositivos móviles reciben la notificación por WebSocket e invalidan su caché local al instante sin recargar la página.
2. **Respaldo Local (BroadcastChannel):**
   * Si varias pestañas están abiertas en el mismo navegador, se comunican localmente vía `BroadcastChannel('digiteca-local-sync')` sin consumir cuota externa de WebSockets.
3. **Respaldo Pasivo (ETags y Polling por Versión):**
   * En caso de que las variables de Pusher no estén configuradas o no haya conexión a Internet externa, el cliente consulta `/api/sync/version` de forma periódica o al reactivar la pestaña, respondiendo con `304 Not Modified` cuando no hay cambios.

---

## 7. Diagnóstico y Resolución de Problemas Frecuentes

### 7.1. Error: `EADDRINUSE: address already in use :::3000`
* **Causa:** Existe otra instancia previa de Node.js u otro proceso utilizando el puerto 3000.
* **Solución en Windows (PowerShell):**
  ```powershell
  # Identificar y terminar el proceso que ocupa el puerto 3000
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
  ```
* **Solución en Linux / macOS:**
  ```bash
  kill -9 $(lsof -t -i:3000)
  ```

### 7.2. Tiempos de Respuesta Prolongados en la Primera Consulta (Cold Start)
* **Causa:** Las instancias gratuitas de CockroachDB Serverless suspenden la computación tras períodos prolongados de inactividad. La primera consulta puede tardar entre 2 y 5 segundos en reactivar el nodo.
* **Mitigación:** El pool de conexiones configurado en `db/connection.js` cuenta con `connectionTimeoutMillis: 30000` y reintentos automáticos para evitar caídas imprevistas durante la reactivación.

### 7.3. Error de Certificado SSL: `self-signed certificate in certificate chain`
* **Causa:** El cliente Node.js no encuentra la cadena de confianza del certificado de CockroachDB.
* **Solución:** Verificar que el archivo `root.crt` se encuentre en la raíz del proyecto o en `%APPDATA%\postgresql\root.crt`. Alternativamente, en entornos locales de prueba puede utilizarse el parámetro `?sslmode=verify-ca` o verificar que la conexión se realice mediante TLS estándar.
