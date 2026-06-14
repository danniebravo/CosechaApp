const { Proceso, Cosecha } = require('../models');
const CosechaService = require('../services/CosechaService');
const { asyncHandler } = require('../utils/helpers');

const listar = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const procesos = await Proceso.findByCosecha(req.params.cosechaId);
  res.json(procesos);
});

const resumen = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const data = await Proceso.getResumenPorTipo(req.params.cosechaId);
  res.json(data);
});

const crear = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.body.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const proceso = await Proceso.create(req.body);
  await Cosecha.recalcularTotales(req.body.cosecha_id);
  res.status(201).json(proceso);
});

const actualizar = asyncHandler(async (req, res) => {
  const proceso = await Proceso.findById(req.params.id);
  if (!proceso) return res.status(404).json({ error: 'Proceso no encontrado' });
  const esPropietario = await CosechaService.verificarPropietario(proceso.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'No autorizado' });
  const updated = await Proceso.update(req.params.id, req.body);
  await Cosecha.recalcularTotales(proceso.cosecha_id);
  res.json(updated);
});

const eliminar = asyncHandler(async (req, res) => {
  const proceso = await Proceso.findById(req.params.id);
  if (!proceso) return res.status(404).json({ error: 'Proceso no encontrado' });
  const esPropietario = await CosechaService.verificarPropietario(proceso.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'No autorizado' });
  await Proceso.delete(req.params.id);
  await Cosecha.recalcularTotales(proceso.cosecha_id);
  res.json({ message: 'Proceso eliminado' });
});

module.exports = { listar, resumen, crear, actualizar, eliminar };
