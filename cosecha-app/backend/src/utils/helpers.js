const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value, decimals = 2) => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(value);
};

const calcularUtilidad = (ingresos, costos) => ingresos - costos;
const calcularCostoPorKg = (costoTotal, produccionTotal) =>
  produccionTotal > 0 ? costoTotal / produccionTotal : 0;
const calcularRendimiento = (produccionTotal, areaSembrada) =>
  areaSembrada > 0 ? produccionTotal / areaSembrada : 0;
const calcularMargen = (utilidad, ingresos) =>
  ingresos > 0 ? (utilidad / ingresos) * 100 : 0;

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = {
  formatCurrency, formatNumber,
  calcularUtilidad, calcularCostoPorKg, calcularRendimiento, calcularMargen,
  asyncHandler,
};
