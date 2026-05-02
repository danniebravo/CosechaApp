const { Insumo, Cosecha } = require('../models');
const CosechaService = require('../services/CosechaService');
const { asyncHandler } = require('../utils/helpers');

const listar = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const insumos = await Insumo.findByCosecha(req.params.cosechaId);
  res.json(insumos);
});

const resumenPorTipo = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const data = await Insumo.getResumenPorTipo(req.params.cosechaId);
  res.json(data);
});

const resumenPorFase = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const data = await Insumo.getResumenPorFase(req.params.cosechaId);
  res.json(data);
});

const crear = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.body.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const insumo = await Insumo.create(req.body);
  await Cosecha.recalcularTotales(req.body.cosecha_id);
  res.status(201).json(insumo);
});

const actualizar = asyncHandler(async (req, res) => {
  const insumo = await Insumo.findById(req.params.id);
  if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado' });
  const esPropietario = await CosechaService.verificarPropietario(insumo.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'No autorizado' });
  const updated = await Insumo.update(req.params.id, req.body);
  await Cosecha.recalcularTotales(insumo.cosecha_id);
  res.json(updated);
});

const eliminar = asyncHandler(async (req, res) => {
  const insumo = await Insumo.findById(req.params.id);
  if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado' });
  const esPropietario = await CosechaService.verificarPropietario(insumo.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'No autorizado' });
  await Insumo.delete(req.params.id);
  await Cosecha.recalcularTotales(insumo.cosecha_id);
  res.json({ message: 'Insumo eliminado' });
});

module.exports = { listar, resumenPorTipo, resumenPorFase, crear, actualizar, eliminar };
