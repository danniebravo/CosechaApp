const { Amediero, Cosecha } = require('../models');
const CosechaService = require('../services/CosechaService');
const { asyncHandler } = require('../utils/helpers');

const listar = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const amedieros = await Amediero.findByCosecha(req.params.cosechaId);
  res.json(amedieros);
});

const distribucion = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const data = await Amediero.getDistribucion(req.params.cosechaId);
  res.json(data);
});

const crear = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.body.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });

  // Validar que los porcentajes no excedan 100%
  const actuales = await Amediero.validarPorcentajes(req.body.cosecha_id);
  const nuevoGanancia = parseFloat(req.body.porcentaje_ganancia) || 0;
  const nuevoInversion = parseFloat(req.body.porcentaje_inversion) || 0;

  if (parseFloat(actuales.total_ganancia) + nuevoGanancia > 100) {
    return res.status(400).json({ error: 'Los porcentajes de ganancia superan el 100%' });
  }
  if (parseFloat(actuales.total_inversion) + nuevoInversion > 100) {
    return res.status(400).json({ error: 'Los porcentajes de inversión superan el 100%' });
  }

  const amediero = await Amediero.create(req.body);
  res.status(201).json(amediero);
});

const actualizar = asyncHandler(async (req, res) => {
  const amediero = await Amediero.findById(req.params.id);
  if (!amediero) return res.status(404).json({ error: 'Amediero no encontrado' });
  const esPropietario = await CosechaService.verificarPropietario(amediero.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'No autorizado' });

  // Validar porcentajes excluyendo el registro actual
  if (req.body.porcentaje_ganancia || req.body.porcentaje_inversion) {
    const actuales = await Amediero.validarPorcentajes(amediero.cosecha_id, req.params.id);
    const nuevoGanancia = parseFloat(req.body.porcentaje_ganancia) || amediero.porcentaje_ganancia;
    const nuevoInversion = parseFloat(req.body.porcentaje_inversion) || amediero.porcentaje_inversion;

    if (parseFloat(actuales.total_ganancia) + nuevoGanancia > 100) {
      return res.status(400).json({ error: 'Los porcentajes de ganancia superan el 100%' });
    }
    if (parseFloat(actuales.total_inversion) + nuevoInversion > 100) {
      return res.status(400).json({ error: 'Los porcentajes de inversión superan el 100%' });
    }
  }

  const updated = await Amediero.update(req.params.id, req.body);
  res.json(updated);
});

const eliminar = asyncHandler(async (req, res) => {
  const amediero = await Amediero.findById(req.params.id);
  if (!amediero) return res.status(404).json({ error: 'Amediero no encontrado' });
  const esPropietario = await CosechaService.verificarPropietario(amediero.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'No autorizado' });
  await Amediero.delete(req.params.id);
  res.json({ message: 'Amediero eliminado' });
});

const recalcular = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });

  const { query } = require('../config/database');
  await query('SELECT recalcular_amedieros($1)', [req.params.cosechaId]);
  const amedieros = await Amediero.findByCosecha(req.params.cosechaId);
  res.json(amedieros);
});

module.exports = { listar, distribucion, crear, actualizar, eliminar, recalcular };
