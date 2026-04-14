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
