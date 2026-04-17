export const formatCOP = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value || 0);

export const formatNum = (value, decimals = 1) =>
  new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(value || 0);

export const formatKg = (value) => `${formatNum(value)} kg`;

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

export const formatDateInput = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
};

export const ESTADOS = {
  planificada: { label: 'Planificada', color: 'bg-blue-100 text-blue-800' },
  en_progreso: { label: 'En progreso', color: 'bg-cosecha-100 text-cosecha-800' },
  cosechada: { label: 'Cosechada', color: 'bg-campo-100 text-campo-800' },
  vendida: { label: 'Vendida', color: 'bg-purple-100 text-purple-800' },
  finalizada: { label: 'Finalizada', color: 'bg-tierra-100 text-tierra-800' },
};

export const TIPOS_ACTIVIDAD = [
  { value: 'siembra', label: 'Siembra', icon: '🌱' },
  { value: 'fertilizacion', label: 'Fertilización', icon: '🧪' },
  { value: 'fumigacion', label: 'Fumigación', icon: '💨' },
  { value: 'riego', label: 'Riego', icon: '💧' },
  { value: 'cosecha', label: 'Cosecha', icon: '🥔' },
  { value: 'otro', label: 'Otro', icon: '📋' },
];

export const TIPOS_GASTO = [
  { value: 'insumos', label: 'Insumos', icon: '🧴' },
  { value: 'mano_de_obra', label: 'Mano de obra', icon: '👷' },
  { value: 'transporte', label: 'Transporte', icon: '🚛' },
  { value: 'maquinaria', label: 'Maquinaria', icon: '🚜' },
  { value: 'arriendo', label: 'Arriendo', icon: '🏠' },
  { value: 'otro', label: 'Otro', icon: '📦' },
];

export const CALIDADES = [
  { value: 'primera', label: 'Primera' },
  { value: 'segunda', label: 'Segunda' },
  { value: 'tercera', label: 'Tercera' },
  { value: 'descarte', label: 'Descarte' },
];

// ── Validaciones de registro ──

export const PREFIJOS_TELEFONICOS = [
  { codigo: '+57',  pais: 'Colombia',       bandera: '\uD83C\uDDE8\uD83C\uDDF4' },
  { codigo: '+1',   pais: 'Estados Unidos',  bandera: '\uD83C\uDDFA\uD83C\uDDF8' },
  { codigo: '+52',  pais: 'M\u00e9xico',    bandera: '\uD83C\uDDF2\uD83C\uDDFD' },
  { codigo: '+34',  pais: 'Espa\u00f1a',    bandera: '\uD83C\uDDEA\uD83C\uDDF8' },
  { codigo: '+51',  pais: 'Per\u00fa',      bandera: '\uD83C\uDDF5\uD83C\uDDEA' },
  { codigo: '+593', pais: 'Ecuador',         bandera: '\uD83C\uDDEA\uD83C\uDDE8' },
  { codigo: '+58',  pais: 'Venezuela',       bandera: '\uD83C\uDDFB\uD83C\uDDEA' },
  { codigo: '+56',  pais: 'Chile',           bandera: '\uD83C\uDDE8\uD83C\uDDF1' },
  { codigo: '+54',  pais: 'Argentina',       bandera: '\uD83C\uDDE6\uD83C\uDDF7' },
  { codigo: '+55',  pais: 'Brasil',          bandera: '\uD83C\uDDE7\uD83C\uDDF7' },
  { codigo: '+507', pais: 'Panam\u00e1',    bandera: '\uD83C\uDDF5\uD83C\uDDE6' },
  { codigo: '+506', pais: 'Costa Rica',      bandera: '\uD83C\uDDE8\uD83C\uDDF7' },
];

export const validarPassword = (password) => {
  const reglas = [
    { test: (p) => p.length >= 8, mensaje: 'M\u00ednimo 8 caracteres', key: 'length' },
    { test: (p) => /[A-Z]/.test(p), mensaje: 'Al menos una may\u00fascula', key: 'upper' },
    { test: (p) => /[0-9]/.test(p), mensaje: 'Al menos un n\u00famero', key: 'number' },
    { test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p), mensaje: 'Al menos un car\u00e1cter especial (!@#$...)', key: 'special' },
  ];
  return reglas.map((r) => ({ ...r, cumple: r.test(password || '') }));
};

export const validarEmail = (email) => {
  const value = (email || '').trim();
  if (!value) return 'Ingresa tu correo electr\u00f3nico';
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(value)) return 'Ingresa un correo electr\u00f3nico v\u00e1lido';
  return null;
};

export const validarTelefono = (numero, prefijo = '+57') => {
  if (!numero) return null; // opcional
  const soloDigitos = numero.replace(/\s/g, '');
  if (!/^\d+$/.test(soloDigitos)) return 'Solo n\u00fameros permitidos';
  if (prefijo === '+57') {
    if (soloDigitos.length !== 10) return 'Para Colombia debe tener exactamente 10 d\u00edgitos';
  } else {
    if (soloDigitos.length < 7 || soloDigitos.length > 15) return 'Debe tener entre 7 y 15 d\u00edgitos';
  }
  return null;
};

export const validarNombre = (nombre) => {
  if (!nombre || !nombre.trim()) return 'El nombre es requerido';
  if (nombre.trim().length < 3) return 'M\u00ednimo 3 caracteres';
  return null;
};

// ── Saludo dinámico según la hora local ──
//
//   05:00–11:59 → "Buenos días"
//   12:00–18:59 → "Buenas tardes"
//   19:00–23:59 → "Buenas noches"
//   00:00–04:59 → "Bienvenido de vuelta"
//
// Si recibe `nombre`, lo concatena solo si tiene contenido válido
// (usa el primer nombre). Sin nombre, devuelve la versión genérica
// sin coma colgante ni espacios.
export const getGreeting = (nombre, date = new Date()) => {
  const h = date.getHours();
  let saludo;
  if (h >= 5  && h <= 11) saludo = 'Buenos d\u00edas';
  else if (h >= 12 && h <= 18) saludo = 'Buenas tardes';
  else if (h >= 19 && h <= 23) saludo = 'Buenas noches';
  else                         saludo = 'Bienvenido de vuelta';

  const primerNombre = (nombre || '').trim().split(/\s+/)[0];
  return primerNombre ? `${saludo}, ${primerNombre}` : saludo;
};
