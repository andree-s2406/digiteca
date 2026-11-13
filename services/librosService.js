const { EMOJIS_MATERIA, CACHE_TTLS } = require('../config/constants');
const syncService = require('./sync');

// Caché ligera en memoria para URLs de PDF, portadas y listado de libros
const pdfUrlCache = new Map();
const portadaCache = new Map();
const PORTADA_CACHE_MAX = 300;
const librosListCache = new Map();
const LIBROS_LIST_TTL_MS = 60 * 1000;

function parseJsonArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val || '[]');
    } catch (_) {
      return [];
    }
  }
  return [];
}

function cleanCoverUrl(raw) {
  let portadaVal = raw || '';
  if (typeof portadaVal === 'string' && (portadaVal.startsWith('file:') || portadaVal.includes('test.jpg'))) {
    portadaVal = 'img/test.jpg';
  }
  return portadaVal;
}

/**
 * Normaliza una fila SQL de `libros` al contrato JSON esperado por el frontend.
 */
function mapLibroRow(row, isDetail = false) {
  let pdfVal = row.pdf_url || '';
  if (!isDetail && typeof pdfVal === 'string' && pdfVal.startsWith('data:') && pdfVal.length > 256) {
    pdfVal = 'archivo:cargado';
  }

  const portadaVal = cleanCoverUrl(row.portada_url);

  return {
    id: row.id,
    t: row.titulo,
    titulo: row.titulo,
    a: row.autor,
    autor: row.autor,
    mat: row.materia,
    materia: row.materia,
    tipo: row.tipo || 'Libro',
    anios: parseJsonArray(row.anios),
    divisiones: parseJsonArray(row.divisiones),
    img: portadaVal,
    portada_url: portadaVal,
    pdf: pdfVal,
    pdf_url: pdfVal,
    hasPdf: !!(row.pdf_url && row.pdf_url.length > 0) || row.tiene_pdf === true,
    e: row.emoji || '📚',
    emoji: row.emoji || '📚',
    c: row.categoria_c || 'ciencias',
    categoria_c: row.categoria_c || 'ciencias',
    l: row.categoria_l || row.materia || 'Ciencias',
    categoria_l: row.categoria_l || row.materia || 'Ciencias',
    x: row.descripcion || '',
    descripcion: row.descripcion || '',
    subioPor: row.subido_por || '',
    subido_por: row.subido_por || ''
  };
}

function resolveLibroMetadata(mat, e, c, l) {
  return {
    emojiFinal: e !== undefined ? e : (EMOJIS_MATERIA[mat] || ''),
    categoriaC: c || mat.toLowerCase().replace(/[^a-z0-9]/g, ''),
    categoriaL: l || mat
  };
}

function getCachedPdfMeta(id) {
  return pdfUrlCache.get(String(id));
}

function setCachedPdfMeta(id, meta) {
  if (pdfUrlCache.size >= CACHE_TTLS.PDF_URL_CACHE_MAX) {
    const firstKey = pdfUrlCache.keys().next().value;
    pdfUrlCache.delete(firstKey);
  }
  pdfUrlCache.set(String(id), meta);
}

function getCachedPortada(id) {
  const key = String(id);
  const entry = portadaCache.get(key);
  if (!entry) return null;
  // Refrescar orden LRU
  portadaCache.delete(key);
  portadaCache.set(key, entry);
  return entry;
}

function setCachedPortada(id, meta) {
  const key = String(id);
  if (portadaCache.has(key)) portadaCache.delete(key);
  if (portadaCache.size >= PORTADA_CACHE_MAX) {
    const firstKey = portadaCache.keys().next().value;
    portadaCache.delete(firstKey);
  }
  portadaCache.set(key, meta);
}

function getCachedLibrosList(cacheKey) {
  const entry = librosListCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.ts > LIBROS_LIST_TTL_MS) {
    librosListCache.delete(cacheKey);
    return null;
  }
  return entry.data;
}

function setCachedLibrosList(cacheKey, data) {
  if (librosListCache.size >= 30) {
    const firstKey = librosListCache.keys().next().value;
    librosListCache.delete(firstKey);
  }
  librosListCache.set(cacheKey, { ts: Date.now(), data });
}

function invalidateLibrosCache(action, payload = {}) {
  librosListCache.clear();
  if (payload && payload.id !== undefined) {
    pdfUrlCache.delete(String(payload.id));
    portadaCache.delete(String(payload.id));
  } else {
    pdfUrlCache.clear();
    portadaCache.clear();
  }
  syncService.notifyDataChange('libros', { action, ...payload }).catch(() => {});
}

module.exports = {
  mapLibroRow,
  cleanCoverUrl,
  resolveLibroMetadata,
  getCachedPdfMeta,
  setCachedPdfMeta,
  getCachedPortada,
  setCachedPortada,
  getCachedLibrosList,
  setCachedLibrosList,
  invalidateLibrosCache
};
