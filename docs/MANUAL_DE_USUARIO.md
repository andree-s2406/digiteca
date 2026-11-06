# Manual de Usuario y Guía de Operación - DigiTeca

Plataforma Institucional de Biblioteca Digital — **Escuela Técnica N° 29 D.E. 6 "Reconquista de Buenos Aires"**

> Documento oficial de uso y operación. Existe una versión formal en formato imprimible PDF ubicada en: [MANUAL_DE_USUARIO.pdf](MANUAL_DE_USUARIO.pdf).

---

## Índice General

1. [Introducción y Propósito Institucional](#1-introducción-y-propósito-institucional)
2. [Requisitos de Acceso y Compatibilidad Técnica](#2-requisitos-de-acceso-y-compatibilidad-técnica)
3. [Navegación y Búsqueda en el Catálogo Bibliográfico](#3-navegación-y-búsqueda-en-el-catálogo-bibliográfico)
4. [Lector Integrado de Documentos en Línea (Visor PDF)](#4-lector-integrado-de-documentos-en-línea-visor-pdf)
5. [Biblioteca Personal: Mis Lecturas Guardadas](#5-biblioteca-personal-mis-lecturas-guardadas)
6. [Gestión de Perfil y Cuenta de Usuario](#6-gestión-de-perfil-y-cuenta-de-usuario)
7. [Autenticación, Seguridad y Recuperación de Acceso](#7-autenticación-seguridad-y-recuperación-de-acceso)
8. [Guía de Operación para el Panel de Administración](#8-guía-de-operación-para-el-panel-de-administración)
9. [Accesibilidad, Modos Visuales y Sincronización](#9-accesibilidad-modos-visuales-y-sincronización)
10. [Preguntas Frecuentes y Asistencia al Usuario](#10-preguntas-frecuentes-y-asistencia-al-usuario)

---

## 1. Introducción y Propósito Institucional

DigiTeca es el repositorio digital oficial de la **Escuela Técnica N° 29 D.E. 6 "Reconquista de Buenos Aires"**, creado para democratizar el acceso a textos de estudio, manuales técnicos, guías pedagógicas y literatura curricular tanto para el ciclo básico como para las especialidades del ciclo superior.

### 1.1. Perfiles de Usuario del Sistema

| Rol | Descripción y Alcances Operativos |
| :--- | :--- |
| **Alumno** | Consulta general del catálogo, lectura en línea de obras correspondientes a su año escolar, guardado de marcadores en sucasillero personal y envío de consultas pedagógicas. |
| **Profesor** | Acceso a todo el material bibliográfico, prescripción y asignación de lecturas a sus divisiones y formulación de solicitudes de incorporación de textos. |
| **Preceptor** | Asistencia y orientación a los alumnos en el uso de la biblioteca digital y seguimiento del estado de cuentas escolares. |
| **Administrador** | Gestión integral del catálogo (altas, modificaciones y bajas), control de cuentas de usuario, configuración del ranking destacado, auditoría de métricas y atención del buzón de mensajes. |

---

## 2. Requisitos de Acceso y Compatibilidad Técnica

DigiTeca funciona de forma nativa a través de cualquier navegador web moderno que cumpla con los estándares HTML5, sin necesidad de instalar complementos ni controladores externos.

* **Navegadores recomendados:** Google Chrome (v100+), Mozilla Firefox (v100+), Microsoft Edge (v100+), Apple Safari (v15+) y navegadores móviles en Android e iOS.
* **Dispositivos compatibles:** Netbooks institucionales (Plan Sarmiento / Conectar Igualdad), computadoras de escritorio, portátiles, tablets y smartphones.
* **Conectividad:** Funciona en la red Wi-Fi institucional de la escuela como a través de conexiones de banda ancha hogareñas.

> **Modalidad de Acceso:** La consulta y exploración del catálogo general es pública y no requiere registro previo. Para utilizar las funciones avanzadas (como el guardado de libros en "Mis Lecturas Guardadas" y la actualización de perfil) se requiere iniciar sesión con la cuenta institucional.

---

## 3. Navegación y Búsqueda en el Catálogo Bibliográfico

Desde el portal principal (`index.html`) o mediante el catálogo (`catalogo.html`), el usuario accede a la totalidad de las obras disponibles.

### 3.1. Búsqueda Textual
En la barra de búsqueda superior, el usuario puede ingresar palabras clave. El sistema evalúa en tiempo real coincidencias sobre:
* **Título de la obra:** Nombres de libros o manuales técnicos.
* **Autor:** Apellido o nombre de los tratadistas y docentes.
* **Materia:** Espacio curricular correspondiente (ej. Matemática, Física, Química, Informática, Sistemas Mecánicos).
* **Descripción:** Resumen temático del contenido.

### 3.2. Filtros Curriculares

| Filtro | Opciones | Propósito |
| :--- | :--- | :--- |
| **Año Escolar** | 1° a 6° Año y Otros | Muestra únicamente los textos destinados al ciclo o año que cursa el estudiante. |
| **Materia** | Lista de asignaturas | Filtra por el departamento docente correspondiente. |
| **Tipo de Obra** | Libro, Apunte, Guía | Permite diferenciar libros de texto extensos de guías de taller o apuntes de cátedra. |

---

## 4. Lector Integrado de Documentos en Línea (Visor PDF)

Al seleccionar **"Leer en línea"** en cualquier tarjeta del catálogo, se abre el visor integrado (`libro.html`).

* **Navegación:** Botones de página anterior, siguiente, salto directo a un número de página específico y visualización del índice temático.
* **Zoom y Enfoque:** Controles de acercamiento (+), alejamiento (-) y ajuste automático al ancho del visor.
* **Ficha Técnica:** Panel desplegable con datos de autoría, reseña y materias relacionadas.

> **Política de Lectura Exclusiva en Línea:** En cumplimiento de las normativas de protección de derechos de autor y preservación de materiales institucionales, está terminantemente prohibida la descarga local de archivos PDF. El sistema utiliza URLs efímeras en memoria volátil (Blob URLs) y el servidor redirige de forma automática cualquier intento de acceso directo hacia el catálogo.

---

## 5. Biblioteca Personal: Mis Lecturas Guardadas

La sección "Mis Lecturas Guardadas" (`descargas.html`) opera como un casillero virtual donde cada alumno o docente conserva los ejemplares que está utilizando para el ciclo lectivo:

1. **Guardar un libro:** Localizar el ejemplar en el catálogo y presionar el botón **"Guardar"**.
2. **Consultar la lista:** Acceder a `descargas.html` desde el menú principal.
3. **Remover un libro:** Una vez completada la lectura, presionar **"Remover de mi cuenta"** para liberar el casillero sin alterar el catálogo general.

---

## 6. Gestión de Perfil y Cuenta de Usuario

Desde la vista de perfil (`micuenta.html`), el usuario registrado puede:
* Comprobar sus datos escolares (nombre, apellido, correo institucional, rol y año de cursada).
* Modificar periódicamente su contraseña de acceso para resguardar la seguridad de su cuenta.
* Verificar el estado de su cuenta (`activo` o `restringido`).

---

## 7. Autenticación, Seguridad y Recuperación de Acceso

El acceso se realiza mediante la pantalla de ingreso (`login.html`):

* **Protección contra fuerza bruta:** El servidor restringe las solicitudes a un máximo de 15 intentos por minuto por dirección IP. Al excederse este umbral, se bloquean las peticiones temporalmente durante 60 segundos.
* **Recuperación de contraseña:** Mediante el enlace "Olvidé mi contraseña" en la pantalla de inicio de sesión o dirigiéndose al preceptor de división para una reasignación manual.
* **Cuentas restringidas:** Si una cuenta ha sido inhabilitada temporalmente por la secretaría escolar, el usuario deberá regularizar su situación ante el personal directivo.

---

## 8. Guía de Operación para el Panel de Administración

El panel de administración (`admin.html`) está destinado al personal docente, preceptores y directivos con rol autorizado:

| Módulo | Funcionalidades Principales |
| :--- | :--- |
| **Gestión de Libros** | Altas, bajas y modificaciones de obras. Subida de archivos PDF (hasta 50 MB) e imágenes de portada (hasta 10 MB) con almacenamiento optimizado en el servidor. |
| **Gestión de Usuarios** | Creación de cuentas, modificación de estados (`activo` / `restringido`), asignación de roles y actualización de contraseñas. |
| **Ranking Destacado** | Configuración manual o dinámica del Top 8 de obras destacadas en el portal de inicio. |
| **Analítica y Métricas** | Seguimiento de los 5 KPIs clave, estadísticas de visitas, distribución de consultas por día y por año de cursada. |
| **Exportación de Reportes** | Generación de informes estructurados en texto (.txt) para presentaciones ante la dirección escolar. |
| **Buzón de Mensajes** | Lectura y respuesta a las solicitudes y consultas remitidas por estudiantes a través del formulario de contacto. |

---

## 9. Accesibilidad, Modos Visuales y Sincronización

* **Selector de Modo Claro / Modo Oscuro:** Botón circular en la barra de navegación superior. El modo claro está pensado para aulas luminosas y el modo oscuro para sesiones de estudio prolongadas o ambientes con baja iluminación. La preferencia queda memorizada en el navegador.
* **Sincronización en Tiempo Real:** Las actualizaciones del catálogo o la incorporación de nuevos libros se sincronizan al instante en todos los dispositivos conectados mediante Pusher WebSockets y BroadcastChannel, sin requerir recargar la página.

---

## 10. Preguntas Frecuentes y Asistencia al Usuario

* **¿Por qué no es posible descargar los libros a la computadora?**  
  Por normativas de preservación de derechos de autor y convenios institucionales. La plataforma garantiza la lectura permanente en línea las 24 horas del día.
* **¿Qué debo hacer si olvidé mi contraseña?**  
  Seleccione "Olvidé mi contraseña" en la pantalla de inicio de sesión o solicite la reasignación a su preceptor o administrador del sistema.
* **¿Cómo propongo la incorporación de un nuevo libro técnico?**  
  Utilice el formulario de contacto institucional seleccionando el asunto "Sugerencia bibliográfica" e indicando el título, autor y materia a la cual se destina.
* **¿Qué significa que mi cuenta figure en estado "restringido"?**  
  Indica que la cuenta fue suspendida temporalmente por la secretaría o regencia escolar. Debe presentarse ante las autoridades institucionales para su reactivación.

---

Para asistencia técnica o consultas académicas adicionales, diríjase al Departamento de Informática de la Escuela Técnica N° 29 D.E. 6 o utilice el formulario de contacto en la plataforma web.
