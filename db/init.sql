-- ===================================================
-- Esquema de Base de Datos para DigiTeca (CockroachDB / PostgreSQL)
-- ===================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'alumno',
    anio VARCHAR(20) DEFAULT 'Otro',
    estado VARCHAR(20) DEFAULT 'activo',
    avatar TEXT,
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS libros (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    materia VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'Libro',
    anios JSONB DEFAULT '[]'::jsonb,
    divisiones JSONB DEFAULT '[]'::jsonb,
    portada_url TEXT,
    pdf_url TEXT,
    emoji VARCHAR(10) DEFAULT '📚',
    categoria_c VARCHAR(100),
    categoria_l VARCHAR(100),
    descripcion TEXT,
    subido_por VARCHAR(255),
    creado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ranking_buscados (
    posicion INT PRIMARY KEY,
    libro_id INT NOT NULL REFERENCES libros(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS descargas (
    id SERIAL PRIMARY KEY,
    usuario_email VARCHAR(255) NOT NULL,
    libro_id INT NOT NULL REFERENCES libros(id) ON DELETE CASCADE,
    fecha_guardado TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS estadisticas_eventos (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    referencia_id INT,
    usuario_email VARCHAR(255),
    usuario_nombre VARCHAR(255),
    usuario_rol VARCHAR(50),
    dia_semana INT,
    anio_cursada VARCHAR(20),
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mensajes_contacto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    rol VARCHAR(50),
    asunto VARCHAR(255),
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sistema_config (
    clave VARCHAR(100) PRIMARY KEY,
    valor VARCHAR(255) NOT NULL,
    actualizado_en TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
