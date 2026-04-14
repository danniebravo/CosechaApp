const { Venta, Cosecha } = require('../models');
const CosechaService = require('../services/CosechaService');
const { asyncHandler } = require('../utils/helpers');

const listar = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const ventas = await Venta.findByCosecha(req.params.cosechaId);
  res.json(ventas);
});

const resumen = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const data = await Venta.getResumenPorCalidad(req.params.cosechaId);
  res.json(data);
});

const crear = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.body.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const venta = await Venta.create(req.body);
  await Cosecha.recalcularTotales(req.body.cosecha_id);
  res.status(201).json(venta);
});

const actualizar = asyncHandler(async (req, res) => {
  const venta = await Venta.findById(req.params.id);
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
  const esPropietario = await CosechaService.verificarPropietario(venta.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'No autorizado' });
  const updated = await Venta.update(req.params.id, req.body);
  await Cosecha.recalcularTotales(venta.cosecha_id);
  res.json(updated);
});

const eliminar = asyncHandler(async (req, res) => {
  const venta = await Venta.findById(req.params.id);
  if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
  const esPropietario = await CosechaService.verificarPropietario(venta.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'No autorizado' });
  await Venta.delete(req.params.id);
  await Cosecha.recalcularTotales(venta.cosecha_id);
  res.json({ message: 'Venta eliminada' });
});

module.exports = { listar, resumen, crear, actualizar, eliminar };
