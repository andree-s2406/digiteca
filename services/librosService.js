const { EMOJIS_MATERIA, CACHE_TTLS } = require('../config/constants');
const syncService = require('./sync');

// Caché ligera en memoria para URLs de PDF (evita repetir SELECT en cada petición Range de PDF.js)
const pdfUrlCache = new Map();

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

function invalidateLibrosCache(action, payload = {}) {
  if (payload && payload.id !== undefined) {
    pdfUrlCache.delete(String(payload.id));
  } else {
    pdfUrlCache.clear();
  }
  syncService.notifyDataChange('libros', { action, ...payload }).catch(() => {});
}

module.exports = {
  mapLibroRow,
  cleanCoverUrl,
  resolveLibroMetadata,
  getCachedPdfMeta,
  setCachedPdfMeta,
  invalidateLibrosCache
};
