const API_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  constructor() {
    this.baseUrl = API_URL;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };

    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { ...options, headers };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error = new Error(data?.error || `Error ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/login';
      }
      throw err;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

const api = new ApiService();

// ── Auth ──
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  registro: (data) => api.post('/auth/registro', data),
  perfil: () => api.get('/auth/perfil'),
};

// ── Fincas ──
export const fincasAPI = {
  listar: () => api.get('/fincas'),
  obtener: (id) => api.get(`/fincas/${id}`),
  crear: (data) => api.post('/fincas', data),
  actualizar: (id, data) => api.put(`/fincas/${id}`, data),
  eliminar: (id) => api.delete(`/fincas/${id}`),
};

// ── Lotes ──
export const lotesAPI = {
  listarPorFinca: (fincaId) => api.get(`/fincas/${fincaId}/lotes`),
  obtener: (id) => api.get(`/lotes/${id}`),
  crear: (data) => api.post('/lotes', data),
  actualizar: (id, data) => api.put(`/lotes/${id}`, data),
  eliminar: (id) => api.delete(`/lotes/${id}`),
};

// ── Cosechas ──
export const cosechasAPI = {
  listar: () => api.get('/cosechas'),
  obtener: (id) => api.get(`/cosechas/${id}`),
  crear: (data) => api.post('/cosechas', data),
  actualizar: (id, data) => api.put(`/cosechas/${id}`, data),
  eliminar: (id) => api.delete(`/cosechas/${id}`),
  estadisticas: () => api.get('/cosechas/estadisticas'),
  dashboard: () => api.get('/cosechas/dashboard'),
};

// ── Actividades ──
export const actividadesAPI = {
  listar: (cosechaId) => api.get(`/cosechas/${cosechaId}/actividades`),
  crear: (data) => api.post('/actividades', data),
  actualizar: (id, data) => api.put(`/actividades/${id}`, data),
  eliminar: (id) => api.delete(`/actividades/${id}`),
};

// ── Gastos ──
export const gastosAPI = {
  listar: (cosechaId) => api.get(`/cosechas/${cosechaId}/gastos`),
  resumen: (cosechaId) => api.get(`/cosechas/${cosechaId}/gastos/resumen`),
  crear: (data) => api.post('/gastos', data),
  actualizar: (id, data) => api.put(`/gastos/${id}`, data),
  eliminar: (id) => api.delete(`/gastos/${id}`),
};

// ── Ventas ──
export const ventasAPI = {
  listar: (cosechaId) => api.get(`/cosechas/${cosechaId}/ventas`),
  resumen: (cosechaId) => api.get(`/cosechas/${cosechaId}/ventas/resumen`),
  crear: (data) => api.post('/ventas', data),
  actualizar: (id, data) => api.put(`/ventas/${id}`, data),
  eliminar: (id) => api.delete(`/ventas/${id}`),
};

export default api;
