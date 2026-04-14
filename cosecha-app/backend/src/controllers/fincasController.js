const { Finca } = require('../models');
const { asyncHandler } = require('../utils/helpers');

const listar = asyncHandler(async (req, res) => {
  const fincas = await Finca.findByUsuario(req.usuario.id);
  res.json(fincas);
});

const obtener = asyncHandler(async (req, res) => {
  const finca = await Finca.findByIdWithLotes(req.params.id);
  if (!finca || finca.usuario_id !== req.usuario.id) {
    return res.status(404).json({ error: 'Finca no encontrada' });
  }
  res.json(finca);
});

const crear = asyncHandler(async (req, res) => {
  const finca = await Finca.create({ ...req.body, usuario_id: req.usuario.id });
  res.status(201).json(finca);
});

const actualizar = asyncHandler(async (req, res) => {
  const existing = await Finca.findById(req.params.id);
  if (!existing || existing.usuario_id !== req.usuario.id) {
    return res.status(404).json({ error: 'Finca no encontrada' });
  }
  const finca = await Finca.update(req.params.id, req.body);
  res.json(finca);
});

const eliminar = asyncHandler(async (req, res) => {
  const existing = await Finca.findById(req.params.id);
  if (!existing || existing.usuario_id !== req.usuario.id) {
    return res.status(404).json({ error: 'Finca no encontrada' });
  }
  await Finca.update(req.params.id, { activa: false });
  res.json({ message: 'Finca eliminada' });
});

module.exports = { listar, obtener, crear, actualizar, eliminar };
