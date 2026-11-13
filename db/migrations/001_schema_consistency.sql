-- ===================================================
-- Migración 001: Consistencia de Usuarios e Índices de Rendimiento
-- Idempotente: segura para ejecutar en cada arranque
-- ===================================================

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS division VARCHAR(20) DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cursos_a_cargo JSONB DEFAULT '[]'::jsonb;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS restringido BOOLEAN DEFAULT FALSE;

-- Índices para acelerar estadísticas, ranking, descargas y catálogo
CREATE INDEX IF NOT EXISTS idx_estadisticas_tipo_fecha ON estadisticas_eventos (tipo, fecha);
CREATE INDEX IF NOT EXISTS idx_estadisticas_ref ON estadisticas_eventos (referencia_id);
CREATE INDEX IF NOT EXISTS idx_descargas_email ON descargas (usuario_email);
CREATE INDEX IF NOT EXISTS idx_descargas_libro ON descargas (libro_id);
CREATE INDEX IF NOT EXISTS idx_libros_materia ON libros (materia);
CREATE INDEX IF NOT EXISTS idx_libros_tipo ON libros (tipo);
