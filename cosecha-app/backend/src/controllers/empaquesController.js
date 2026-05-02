const { Empaque, Cosecha } = require('../models');
const CosechaService = require('../services/CosechaService');
const { asyncHandler } = require('../utils/helpers');

const listar = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const empaques = await Empaque.findByCosecha(req.params.cosechaId);
  res.json(empaques);
});

const resumen = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const data = await Empaque.getResumenPorTipo(req.params.cosechaId);
  res.json(data);
});

const crear = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.body.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const empaque = await Empaque.create(req.body);
  await Cosecha.recalcularTotales(req.body.cosecha_id);
  res.status(201).json(empaque);
});

const actualizar = asyncHandler(async (req, res) => {
  const empaque = await Empaque.findById(req.params.id);
  if (!empaque) return res.status(404).json({ error: 'Empaque no encontrado' });
  const esPropietario = await CosechaService.verificarPropietario(empaque.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'No autorizado' });
  const updated = await Empaque.update(req.params.id, req.body);
  await Cosecha.recalcularTotales(empaque.cosecha_id);
  res.json(updated);
});

const eliminar = asyncHandler(async (req, res) => {
  const empaque = await Empaque.findById(req.params.id);
  if (!empaque) return res.status(404).json({ error: 'Empaque no encontrado' });
  const esPropietario = await CosechaService.verificarPropietario(empaque.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'No autorizado' });
  await Empaque.delete(req.params.id);
  await Cosecha.recalcularTotales(empaque.cosecha_id);
  res.json({ message: 'Empaque eliminado' });
});

module.exports = { listar, resumen, crear, actualizar, eliminar };
