/**
 * DigiTeca API Client
 * Capa de integración frontend con la API REST y CockroachDB
 */
const API_BASE = window.location.origin.includes('http') ? '' : 'http://localhost:3000';

const API = {
  // Base request wrapper
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    let sesion = {};
    try {
      sesion = JSON.parse(localStorage.getItem('digi-sesion') || '{}');
    } catch(e) {}

    const headers = {
      'Content-Type': 'application/json',
      ...(sesion.email ? {
        'x-user-email': sesion.email,
        'x-user-rol': sesion.rol || 'alumno'
      } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }
      return data;
    } catch (err) {
      console.warn(`[API] Fallo en ${endpoint}:`, err.message);
      throw err;
    }
  },

  // 1. Autenticación
  auth: {
    async login(email, password) {
      return API.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    },
    async resetPassword(email) {
      return API.request('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    }
  },

  // 2. Libros
  libros: {
    async getAll(filters = {}) {
      const params = new URLSearchParams();
      if (filters.q) params.append('q', filters.q);
      if (filters.materia) params.append('materia', filters.materia);
      if (filters.anio) params.append('anio', filters.anio);
      if (filters.tipo) params.append('tipo', filters.tipo);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return API.request(`/api/libros${queryStr}`);
    },
    async getById(id) {
      return API.request(`/api/libros/${id}`);
    },
    async create(libroData) {
      return API.request('/api/libros', {
        method: 'POST',
        body: JSON.stringify(libroData)
      });
    },
    async update(id, libroData) {
      return API.request(`/api/libros/${id}`, {
        method: 'PUT',
        body: JSON.stringify(libroData)
      });
    },
    async delete(id) {
      return API.request(`/api/libros/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // 3. Usuarios
  usuarios: {
    async getAll() {
      return API.request('/api/usuarios');
    },
    async create(usuarioData) {
      return API.request('/api/usuarios', {
        method: 'POST',
        body: JSON.stringify(usuarioData)
      });
    },
    async update(id, usuarioData) {
      return API.request(`/api/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(usuarioData)
      });
    },
    async updatePerfil(perfilData) {
      return API.request('/api/usuarios/perfil', {
        method: 'PUT',
        body: JSON.stringify(perfilData)
      });
    },
    async setEstado(id, estado) {
      return API.request(`/api/usuarios/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado })
      });
    },
    async delete(id) {
      return API.request(`/api/usuarios/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // 4. Descargas y Guardados
  descargas: {
    async getByEmail(email) {
      return API.request(`/api/descargas?email=${encodeURIComponent(email)}`);
    },
    async add(email, libroId) {
      return API.request('/api/descargas', {
        method: 'POST',
        body: JSON.stringify({ email, libroId })
      });
    },
    async remove(email, libroId) {
      return API.request(`/api/descargas/${libroId}?email=${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
    },
    async clear(email) {
      return API.request(`/api/descargas/limpiar/todo?email=${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
    }
  },

  // 5. Ranking
  ranking: {
    async get() {
      return API.request('/api/ranking');
    },
    async save(ids) {
      return API.request('/api/ranking', {
        method: 'PUT',
        body: JSON.stringify({ ids })
      });
    }
  },

  // 6. Estadísticas y Reportes
  stats: {
    async get(periodo = 'todo', desde = '', hasta = '') {
      let q = `?periodo=${periodo}`;
      if (desde) q += `&desde=${desde}`;
      if (hasta) q += `&hasta=${hasta}`;
      return API.request(`/api/stats${q}`);
    },
    async registrarVisita() {
      return API.request('/api/stats/visita', { method: 'POST' });
    },
    async registrarLectura(libroId, usuarioEmail, anio) {
      return API.request('/api/stats/libro-abierto', {
        method: 'POST',
        body: JSON.stringify({ libroId, usuarioEmail, anio })
      });
    },
    getReporteUrl(periodo = 'todo', desde = '', hasta = '') {
      let q = `?periodo=${periodo}`;
      if (desde) q += `&desde=${desde}`;
      if (hasta) q += `&hasta=${hasta}`;
      return `${API_BASE}/api/stats/reporte-texto${q}`;
    }
  },

  // 7. Subida de archivos
  upload: {
    async pdf(file) {
      const formData = new FormData();
      formData.append('pdf', file);
      const res = await fetch(`${API_BASE}/api/upload/pdf`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Error al subir PDF');
      return res.json();
    },
    async portada(file) {
      const formData = new FormData();
      formData.append('imagen', file);
      const res = await fetch(`${API_BASE}/api/upload/portada`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Error al subir portada');
      return res.json();
    }
  },

  // 8. Contacto
  contacto: {
    async send(data) {
      return API.request('/api/contacto', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    async getAll() {
      return API.request('/api/contacto');
    }
  }
};

window.API = API;
