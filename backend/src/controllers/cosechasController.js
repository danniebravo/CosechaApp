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

module.exports = { listar, obtener, crear, actualizar, eliminar, estadisticas, dashboard };
