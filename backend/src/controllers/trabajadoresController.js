const { Trabajador, Jornada, Cosecha } = require('../models');
const CosechaService = require('../services/CosechaService');
const { asyncHandler } = require('../utils/helpers');

// ── Trabajadores (maestro del usuario) ──

const listar = asyncHandler(async (req, res) => {
  const trabajadores = await Trabajador.findByUsuario(req.usuario.id);
  res.json(trabajadores);
});

const crear = asyncHandler(async (req, res) => {
  const trabajador = await Trabajador.create({
    ...req.body,
    usuario_id: req.usuario.id,
  });
  res.status(201).json(trabajador);
});

const actualizar = asyncHandler(async (req, res) => {
  const trabajador = await Trabajador.findById(req.params.id);
  if (!trabajador || trabajador.usuario_id !== req.usuario.id) {
    return res.status(404).json({ error: 'Trabajador no encontrado' });
  }
  const updated = await Trabajador.update(req.params.id, req.body);
  res.json(updated);
});

const eliminar = asyncHandler(async (req, res) => {
  const trabajador = await Trabajador.findById(req.params.id);
  if (!trabajador || trabajador.usuario_id !== req.usuario.id) {
    return res.status(404).json({ error: 'Trabajador no encontrado' });
  }
  await Trabajador.update(req.params.id, { activo: false });
  res.json({ message: 'Trabajador eliminado' });
});

// ── Asignación a cosechas ──

const listarPorCosecha = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const trabajadores = await Trabajador.findByCosecha(req.params.cosechaId);
  res.json(trabajadores);
});

const asignar = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.body.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });

  const trabajador = await Trabajador.findById(req.body.trabajador_id);
  if (!trabajador || trabajador.usuario_id !== req.usuario.id) {
    return res.status(404).json({ error: 'Trabajador no encontrado' });
  }

  const asignacion = await Trabajador.asignarACosecha(req.body.cosecha_id, req.body.trabajador_id, {
    valor_dia: req.body.valor_dia,
    valor_hora: req.body.valor_hora,
    valor_bulto: req.body.valor_bulto,
    modalidad: req.body.modalidad,
  });
  res.status(201).json(asignacion);
});

const desasignar = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  await Trabajador.desasignarDeCosecha(req.params.cosechaId, req.params.trabajadorId);
  res.json({ message: 'Trabajador desasignado' });
});

const resumenPorCosecha = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const resumen = await Trabajador.getResumenPorCosecha(req.params.cosechaId);
  res.json(resumen);
});

// ── Jornadas de trabajo ──

const listarJornadas = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const jornadas = await Jornada.findByCosecha(req.params.cosechaId);
  res.json(jornadas);
});

const crearJornada = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.body.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const jornada = await Jornada.create(req.body);
  await Cosecha.recalcularTotales(req.body.cosecha_id);
  res.status(201).json(jornada);
});

const actualizarJornada = asyncHandler(async (req, res) => {
  const jornada = await Jornada.findById(req.params.id);
  if (!jornada) return res.status(404).json({ error: 'Jornada no encontrada' });
  const esPropietario = await CosechaService.verificarPropietario(jornada.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'No autorizado' });
  const updated = await Jornada.update(req.params.id, req.body);
  await Cosecha.recalcularTotales(jornada.cosecha_id);
  res.json(updated);
});

const eliminarJornada = asyncHandler(async (req, res) => {
  const jornada = await Jornada.findById(req.params.id);
  if (!jornada) return res.status(404).json({ error: 'Jornada no encontrada' });
  const esPropietario = await CosechaService.verificarPropietario(jornada.cosecha_id, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'No autorizado' });
  await Jornada.delete(req.params.id);
  await Cosecha.recalcularTotales(jornada.cosecha_id);
  res.json({ message: 'Jornada eliminada' });
});

const resumenDiario = asyncHandler(async (req, res) => {
  const esPropietario = await CosechaService.verificarPropietario(req.params.cosechaId, req.usuario.id);
  if (!esPropietario) return res.status(404).json({ error: 'Cosecha no encontrada' });
  const resumen = await Jornada.getResumenDiario(req.params.cosechaId);
  res.json(resumen);
});

module.exports = {
  listar, crear, actualizar, eliminar,
  listarPorCosecha, asignar, desasignar, resumenPorCosecha,
  listarJornadas, crearJornada, actualizarJornada, eliminarJornada, resumenDiario,
};
