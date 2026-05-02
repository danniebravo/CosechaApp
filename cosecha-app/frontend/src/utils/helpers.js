export const formatCOP = (value) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value || 0);

export const formatNum = (value, decimals = 1) =>
  new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(value || 0);

export const formatKg = (value) => `${formatNum(value)} kg`;

export const formatUnidad = (value, unidad = 'kilos') =>
  unidad === 'bultos'
    ? `${formatNum(value, 0)} bultos`
    : `${formatNum(value)} kg`;

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

export const TIPOS_SUELO = [
  { value: 'franco', label: 'Franco' },
  { value: 'franco_arcilloso', label: 'Franco arcilloso' },
  { value: 'franco_arenoso', label: 'Franco arenoso' },
  { value: 'franco_limoso', label: 'Franco limoso' },
  { value: 'arcilloso', label: 'Arcilloso' },
  { value: 'arenoso', label: 'Arenoso' },
  { value: 'limoso', label: 'Limoso' },
  { value: 'humifero', label: 'Humifero (negro)' },
  { value: 'volcanico', label: 'Volcanico (andisol)' },
  { value: 'pedregoso', label: 'Pedregoso' },
  { value: 'otro', label: 'Otro' },
];

export const VARIEDADES_PAPA = [
  { value: 'Pastusa Suprema',    label: 'Pastusa Suprema',    dias: 150 },
  { value: 'Diacol Capiro',      label: 'Diacol Capiro (R-12)', dias: 150 },
  { value: 'Parda Pastusa',      label: 'Parda Pastusa',      dias: 165 },
  { value: 'ICA Unica',          label: 'ICA Unica',          dias: 140 },
  { value: 'Tuquerena',          label: 'Tuquerena',          dias: 160 },
  { value: 'Betina',             label: 'Betina',             dias: 120 },
  { value: 'Rubi',               label: 'Rubi',               dias: 140 },
  { value: 'Sabanera',           label: 'Sabanera',           dias: 155 },
  { value: 'Criolla Colombia',   label: 'Criolla Colombia',   dias: 120 },
  { value: 'Criolla Galeras',    label: 'Criolla Galeras',    dias: 115 },
  { value: 'Criolla Guanena',    label: 'Criolla Guanena',    dias: 110 },
  { value: 'Superior',           label: 'Superior',           dias: 150 },
  { value: 'ICA Nevada',         label: 'ICA Nevada',         dias: 145 },
  { value: 'Otra',               label: 'Otra variedad',      dias: 150 },
];

/**
 * Calcula fecha de cosecha estimada a partir de fecha de siembra y variedad.
 * Retorna string ISO date o null.
 */
export const calcularFechaCosechaEstimada = (fechaSiembra, variedad) => {
  if (!fechaSiembra) return null;
  const config = VARIEDADES_PAPA.find((v) => v.value === variedad);
  const dias = config?.dias || 150;
  const siembra = new Date(fechaSiembra);
  siembra.setDate(siembra.getDate() + dias);
  return siembra.toISOString().split('T')[0];
};

export const CALIDADES = [
  { value: 'primera', label: 'Primera' },
  { value: 'segunda', label: 'Segunda' },
  { value: 'tercera', label: 'Tercera' },
  { value: 'descarte', label: 'Descarte' },
];

// ── Prefijos telefónicos con reglas de dígitos por país ──

export const PREFIJOS_TELEFONICOS = [
  { codigo: '+57',  pais: 'Colombia',        bandera: '\uD83C\uDDE8\uD83C\uDDF4', digitos: 10, placeholder: '300 123 4567' },
  { codigo: '+1',   pais: 'Estados Unidos',  bandera: '\uD83C\uDDFA\uD83C\uDDF8', digitos: 10, placeholder: '202 555 0123' },
  { codigo: '+52',  pais: 'M\u00e9xico',     bandera: '\uD83C\uDDF2\uD83C\uDDFD', digitos: 10, placeholder: '55 1234 5678' },
  { codigo: '+34',  pais: 'Espa\u00f1a',     bandera: '\uD83C\uDDEA\uD83C\uDDF8', digitos: 9,  placeholder: '612 345 678' },
  { codigo: '+51',  pais: 'Per\u00fa',       bandera: '\uD83C\uDDF5\uD83C\uDDEA', digitos: 9,  placeholder: '912 345 678' },
  { codigo: '+593', pais: 'Ecuador',          bandera: '\uD83C\uDDEA\uD83C\uDDE8', digitos: 9,  placeholder: '99 123 4567' },
  { codigo: '+58',  pais: 'Venezuela',        bandera: '\uD83C\uDDFB\uD83C\uDDEA', digitos: 10, placeholder: '412 123 4567' },
  { codigo: '+56',  pais: 'Chile',            bandera: '\uD83C\uDDE8\uD83C\uDDF1', digitos: 9,  placeholder: '9 1234 5678' },
  { codigo: '+54',  pais: 'Argentina',        bandera: '\uD83C\uDDE6\uD83C\uDDF7', digitos: 10, placeholder: '11 1234 5678' },
  { codigo: '+55',  pais: 'Brasil',           bandera: '\uD83C\uDDE7\uD83C\uDDF7', digitos: 11, placeholder: '11 91234 5678' },
  { codigo: '+507', pais: 'Panam\u00e1',     bandera: '\uD83C\uDDF5\uD83C\uDDE6', digitos: 8,  placeholder: '6123 4567' },
  { codigo: '+506', pais: 'Costa Rica',       bandera: '\uD83C\uDDE8\uD83C\uDDF7', digitos: 8,  placeholder: '8312 3456' },
  { codigo: '+502', pais: 'Guatemala',        bandera: '\uD83C\uDDEC\uD83C\uDDF9', digitos: 8,  placeholder: '5123 4567' },
  { codigo: '+503', pais: 'El Salvador',      bandera: '\uD83C\uDDF8\uD83C\uDDFB', digitos: 8,  placeholder: '7012 3456' },
  { codigo: '+504', pais: 'Honduras',         bandera: '\uD83C\uDDED\uD83C\uDDF3', digitos: 8,  placeholder: '9512 3456' },
  { codigo: '+505', pais: 'Nicaragua',        bandera: '\uD83C\uDDF3\uD83C\uDDEE', digitos: 8,  placeholder: '8123 4567' },
  { codigo: '+591', pais: 'Bolivia',          bandera: '\uD83C\uDDE7\uD83C\uDDF4', digitos: 8,  placeholder: '7123 4567' },
  { codigo: '+595', pais: 'Paraguay',         bandera: '\uD83C\uDDF5\uD83C\uDDFE', digitos: 9,  placeholder: '981 123 456' },
  { codigo: '+598', pais: 'Uruguay',          bandera: '\uD83C\uDDFA\uD83C\uDDFE', digitos: 8,  placeholder: '9412 3456' },
  { codigo: '+53',  pais: 'Cuba',             bandera: '\uD83C\uDDE8\uD83C\uDDFA', digitos: 8,  placeholder: '5123 4567' },
  { codigo: '+1809',pais: 'Rep. Dominicana',  bandera: '\uD83C\uDDE9\uD83C\uDDF4', digitos: 7,  placeholder: '555 0123' },
];

/**
 * Obtener config de un prefijo. Retorna el objeto del prefijo o fallback genérico.
 */
export const getPrefijoConfig = (codigo) =>
  PREFIJOS_TELEFONICOS.find((p) => p.codigo === codigo) || { codigo, digitos: 10, placeholder: 'Numero' };

export const validarPassword = (password) => {
  const reglas = [
    { test: (p) => p.length >= 8, mensaje: 'Minimo 8 caracteres', key: 'length' },
    { test: (p) => /[a-z]/.test(p), mensaje: 'Al menos una minuscula', key: 'lower' },
    { test: (p) => /[A-Z]/.test(p), mensaje: 'Al menos una mayuscula', key: 'upper' },
    { test: (p) => /[0-9]/.test(p), mensaje: 'Al menos un numero', key: 'number' },
    { test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p), mensaje: 'Al menos un caracter especial (!@#$...)', key: 'special' },
  ];
  return reglas.map((r) => ({ ...r, cumple: r.test(password || '') }));
};

/**
 * Calcula la fuerza de la contraseña (0-4).
 * 0 = muy débil, 1 = débil, 2 = media, 3 = fuerte, 4 = muy fuerte
 */
export const calcularFuerzaPassword = (password) => {
  if (!password) return { nivel: 0, label: '', color: '' };
  const reglas = validarPassword(password);
  const cumplidas = reglas.filter((r) => r.cumple).length;

  const niveles = [
    { nivel: 0, label: 'Muy debil', color: 'bg-red-500' },
    { nivel: 1, label: 'Debil', color: 'bg-red-400' },
    { nivel: 2, label: 'Media', color: 'bg-cosecha-500' },
    { nivel: 3, label: 'Fuerte', color: 'bg-campo-500' },
    { nivel: 4, label: 'Muy fuerte', color: 'bg-campo-600' },
  ];

  // Bonus por longitud
  let score = cumplidas;
  if (password.length >= 12) score = Math.min(score + 1, 4);
  if (password.length < 6) score = Math.max(score - 1, 0);

  // Mapear 0-5 reglas a 0-4 niveles
  const nivelIndex = Math.min(Math.max(Math.floor(score * (4 / 5)), 0), 4);
  return niveles[nivelIndex];
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
  if (!/^\d+$/.test(soloDigitos)) return 'Solo numeros permitidos';

  const config = getPrefijoConfig(prefijo);
  const esperados = config.digitos;

  if (soloDigitos.length !== esperados) {
    const pais = config.pais || prefijo;
    return `Para ${pais} el telefono debe tener exactamente ${esperados} digitos`;
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
