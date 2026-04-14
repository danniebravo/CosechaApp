const AlertService = require('../services/AlertService');
const { asyncHandler } = require('../utils/helpers');

const listarPendientes = asyncHandler(async (req, res) => {
  const alertas = await AlertService.obtenerPendientes(req.usuario.id);
  res.json(alertas);
});

const contarPendientes = asyncHandler(async (req, res) => {
  const total = await AlertService.contarPendientes(req.usuario.id);
  res.json({ total });
});

const generarParaCosecha = asyncHandler(async (req, res) => {
  const total = await AlertService.generarAlertas(req.params.cosechaId);
  res.json({ message: `${total} alertas generadas`, total });
});

const completar = asyncHandler(async (req, res) => {
  const alerta = await AlertService.completar(req.params.id, req.usuario.id);
  res.json(alerta);
});

const descartar = asyncHandler(async (req, res) => {
  const alerta = await AlertService.descartar(req.params.id, req.usuario.id);
  res.json(alerta);
});

module.exports = { listarPendientes, contarPendientes, generarParaCosecha, completar, descartar };
