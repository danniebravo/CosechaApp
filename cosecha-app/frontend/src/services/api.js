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
  loginGoogle: (data) => api.post('/auth/login-google', data),
  sendLoginOtp: (data) => api.post('/auth/send-login-otp', data),
  verifyLoginOtp: (data) => api.post('/auth/verify-login-otp', data),
  registro: (data) => api.post('/auth/registro', data),
  perfil: () => api.get('/auth/perfil'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  forgotByPhone: (data) => api.post('/auth/forgot-by-phone', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  sendEmailVerification: () => api.post('/auth/send-email-verification'),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  loginApple: (data) => api.post('/auth/login-apple', data),
};

// ── Onboarding ──
export const onboardingAPI = {
  completar: (data) => api.post('/onboarding', data),
  status: () => api.get('/onboarding/status'),
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
  calcularFecha: (variedad, fecha_siembra) =>
    api.get(`/cosechas/calcular-fecha?variedad=${encodeURIComponent(variedad || '')}&fecha_siembra=${fecha_siembra}`),
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

// ── Alertas (BUGFIX: faltaba este módulo) ──
export const alertasAPI = {
  listarPendientes: () => api.get('/alertas'),
  contarPendientes: () => api.get('/alertas/count'),
  generar: (cosechaId) => api.post(`/cosechas/${cosechaId}/alertas/generar`),
  completar: (id) => api.put(`/alertas/${id}/completar`),
  descartar: (id) => api.put(`/alertas/${id}/descartar`),
};

// ── Trabajadores ──
export const trabajadoresAPI = {
  listar: () => api.get('/trabajadores'),
  crear: (data) => api.post('/trabajadores', data),
  actualizar: (id, data) => api.put(`/trabajadores/${id}`, data),
  eliminar: (id) => api.delete(`/trabajadores/${id}`),
  // Por cosecha
  listarPorCosecha: (cosechaId) => api.get(`/cosechas/${cosechaId}/trabajadores`),
  resumenPorCosecha: (cosechaId) => api.get(`/cosechas/${cosechaId}/trabajadores/resumen`),
  asignar: (data) => api.post('/cosechas/trabajadores/asignar', data),
  desasignar: (cosechaId, trabajadorId) => api.delete(`/cosechas/${cosechaId}/trabajadores/${trabajadorId}`),
};

// ── Jornadas de trabajo ──
export const jornadasAPI = {
  listar: (cosechaId) => api.get(`/cosechas/${cosechaId}/jornadas`),
  resumenDiario: (cosechaId) => api.get(`/cosechas/${cosechaId}/jornadas/resumen-diario`),
  crear: (data) => api.post('/jornadas', data),
  actualizar: (id, data) => api.put(`/jornadas/${id}`, data),
  eliminar: (id) => api.delete(`/jornadas/${id}`),
};

// ── Insumos ──
export const insumosAPI = {
  listar: (cosechaId) => api.get(`/cosechas/${cosechaId}/insumos`),
  resumenPorTipo: (cosechaId) => api.get(`/cosechas/${cosechaId}/insumos/resumen-tipo`),
  resumenPorFase: (cosechaId) => api.get(`/cosechas/${cosechaId}/insumos/resumen-fase`),
  crear: (data) => api.post('/insumos', data),
  actualizar: (id, data) => api.put(`/insumos/${id}`, data),
  eliminar: (id) => api.delete(`/insumos/${id}`),
};

// ── Empaques ──
export const empaquesAPI = {
  listar: (cosechaId) => api.get(`/cosechas/${cosechaId}/empaques`),
  resumen: (cosechaId) => api.get(`/cosechas/${cosechaId}/empaques/resumen`),
  crear: (data) => api.post('/empaques', data),
  actualizar: (id, data) => api.put(`/empaques/${id}`, data),
  eliminar: (id) => api.delete(`/empaques/${id}`),
};

// ── Fletes / Transporte ──
export const fletesAPI = {
  listar: (cosechaId) => api.get(`/cosechas/${cosechaId}/fletes`),
  resumen: (cosechaId) => api.get(`/cosechas/${cosechaId}/fletes/resumen`),
  crear: (data) => api.post('/fletes', data),
  actualizar: (id, data) => api.put(`/fletes/${id}`, data),
  eliminar: (id) => api.delete(`/fletes/${id}`),
};

// ── Procesos de cultivo ──
export const procesosAPI = {
  listar: (cosechaId) => api.get(`/cosechas/${cosechaId}/procesos`),
  resumen: (cosechaId) => api.get(`/cosechas/${cosechaId}/procesos/resumen`),
  crear: (data) => api.post('/procesos', data),
  actualizar: (id, data) => api.put(`/procesos/${id}`, data),
  eliminar: (id) => api.delete(`/procesos/${id}`),
};

// ── Amedieros / Socios ──
export const amedierosAPI = {
  listar: (cosechaId) => api.get(`/cosechas/${cosechaId}/amedieros`),
  distribucion: (cosechaId) => api.get(`/cosechas/${cosechaId}/amedieros/distribucion`),
  recalcular: (cosechaId) => api.post(`/cosechas/${cosechaId}/amedieros/recalcular`),
  crear: (data) => api.post('/amedieros', data),
  actualizar: (id, data) => api.put(`/amedieros/${id}`, data),
  eliminar: (id) => api.delete(`/amedieros/${id}`),
};

export default api;
