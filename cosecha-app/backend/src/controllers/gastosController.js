const { Gasto, Cosecha } = require('../models');
const CosechaService = require('../services/CosechaService');
const { asyncHandler } = require('../utils/helpers');

const listar = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const gastos = await Gasto.findByCosecha(req.params.cosechaId);
  res.json(gastos);
});

const resumen = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const data = await Gasto.getResumenPorTipo(req.params.cosechaId);
  res.json(data);
});

const crear = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.body.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const gasto = await Gasto.create(req.body);
  await Cosecha.recalcularTotales(req.body.cosecha_id);
  res.status(201).json(gasto);
});

const actualizar = asyncHandler(async (req, res) => {
  const gasto = await Gasto.findById(req.params.id);
  if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado' });
  const esPropietario = await CosechaService.verificarPropietario(gasto.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'No autorizado' });
  const updated = await Gasto.update(req.params.id, req.body);
  await Cosecha.recalcularTotales(gasto.cosecha_id);
  res.json(updated);
});

const eliminar = asyncHandler(async (req, res) => {
  const gasto = await Gasto.findById(req.params.id);
  if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado' });
  const esPropietario = await CosechaService.verificarPropietario(gasto.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'No autorizado' });
  await Gasto.delete(req.params.id);
  await Cosecha.recalcularTotales(gasto.cosecha_id);
  res.json({ message: 'Gasto eliminado' });
});

module.exports = { listar, resumen, crear, actualizar, eliminar };
