const { Actividad, Cosecha } = require('../models');
const CosechaService = require('../services/CosechaService');
const { asyncHandler } = require('../utils/helpers');

const listar = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const actividades = await Actividad.findByCosecha(req.params.cosechaId);
  res.json(actividades);
});

const crear = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.body.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const actividad = await Actividad.create(req.body);
  await Cosecha.recalcularTotales(req.body.cosecha_id);
  res.status(201).json(actividad);
});

const actualizar = asyncHandler(async (req, res) => {
  const actividad = await Actividad.findById(req.params.id);
  if (!actividad) return res.status(404).json({ error: 'Actividad no encontrada' });
  const esPropietario = await CosechaService.verificarPropietario(actividad.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'No autorizado' });
  const updated = await Actividad.update(req.params.id, req.body);
  await Cosecha.recalcularTotales(actividad.cosecha_id);
  res.json(updated);
});

const eliminar = asyncHandler(async (req, res) => {
  const actividad = await Actividad.findById(req.params.id);
  if (!actividad) return res.status(404).json({ error: 'Actividad no encontrada' });
  const esPropietario = await CosechaService.verificarPropietario(actividad.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'No autorizado' });
  await Actividad.delete(req.params.id);
  await Cosecha.recalcularTotales(actividad.cosecha_id);
  res.json({ message: 'Actividad eliminada' });
});

module.exports = { listar, crear, actualizar, eliminar };
