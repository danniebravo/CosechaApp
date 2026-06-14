const { Flete, Cosecha } = require('../models');
const CosechaService = require('../services/CosechaService');
const { asyncHandler } = require('../utils/helpers');

const listar = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const fletes = await Flete.findByCosecha(req.params.cosechaId);
  res.json(fletes);
});

const resumen = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const data = await Flete.getResumen(req.params.cosechaId);
  res.json(data);
});

const crear = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.body.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const flete = await Flete.create(req.body);
  await Cosecha.recalcularTotales(req.body.cosecha_id);
  res.status(201).json(flete);
});

const actualizar = asyncHandler(async (req, res) => {
  const flete = await Flete.findById(req.params.id);
  if (!flete) return res.status(404).json({ error: 'Flete no encontrado' });
  const esPropietario = await CosechaService.verificarPropietario(flete.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'No autorizado' });
  const updated = await Flete.update(req.params.id, req.body);
  await Cosecha.recalcularTotales(flete.cosecha_id);
  res.json(updated);
});

const eliminar = asyncHandler(async (req, res) => {
  const flete = await Flete.findById(req.params.id);
  if (!flete) return res.status(404).json({ error: 'Flete no encontrado' });
  const esPropietario = await CosechaService.verificarPropietario(flete.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'No autorizado' });
  await Flete.delete(req.params.id);
  await Cosecha.recalcularTotales(flete.cosecha_id);
  res.json({ message: 'Flete eliminado' });
});

module.exports = { listar, resumen, crear, actualizar, eliminar };
