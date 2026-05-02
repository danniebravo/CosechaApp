const CosechaService = require('../services/CosechaService');
const { asyncHandler } = require('../utils/helpers');

const listar = asyncHandler(async (req, res) => {
  const cosechas = await CosechaService.listar(req.usuario.id);
  res.json(cosechas);
});

const obtener = asyncHandler(async (req, res) => {
  const cosecha = await CosechaService.obtener(req.params.id, req.usuario.id);
  res.json(cosecha);
});

const crear = asyncHandler(async (req, res) => {
  const cosecha = await CosechaService.crear(req.body, req.usuario.id);
  res.status(201).json(cosecha);
});

const actualizar = asyncHandler(async (req, res) => {
  const cosecha = await CosechaService.actualizar(req.params.id, req.body, req.usuario.id);
  res.json(cosecha);
});

const eliminar = asyncHandler(async (req, res) => {
  await CosechaService.eliminar(req.params.id, req.usuario.id);
  res.json({ message: 'Cosecha eliminada' });
});

const estadisticas = asyncHandler(async (req, res) => {
  const stats = await CosechaService.getEstadisticas(req.usuario.id);
  res.json(stats);
});

const dashboard = asyncHandler(async (req, res) => {
  const data = await CosechaService.getDashboard(req.usuario.id);
  res.json(data);
});

const exportarExcel = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });

  const ExportService = require('../services/ExportService');
  const result = await ExportService.generarExcelCosecha(req.params.id);
  if (!result) return res.status(404).json({ error: 'Cosecha no encontrada' });

  const { workbook, cosecha } = result;
  const filename = `cosecha_${cosecha.variedad_papa.replace(/\s+/g, '_')}_${cosecha.fecha_siembra}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
});

const calcularFecha = asyncHandler(async (req, res) => {
  const AlertService = require('../services/AlertService');
  const { variedad, fecha_siembra } = req.query;
  if (!fecha_siembra) return res.status(400).json({ error: 'fecha_siembra requerida' });
  const result = AlertService.calcularFechaCosecha(fecha_siembra, variedad || '');
  res.json(result);
});

module.exports = { listar, obtener, crear, actualizar, eliminar, estadisticas, dashboard, calcularFecha, exportarExcel };
