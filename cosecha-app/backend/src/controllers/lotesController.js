const { Lote, Finca } = require('../models');
const { asyncHandler } = require('../utils/helpers');

const listarPorFinca = asyncHandler(async (req, res) => {
  const finca = await Finca.findById(req.params.fincaId);
  if (!finca || finca.usuario_id !== req.usuario.id) {
    return res.status(404).json({ error: 'Finca no encontrada' });
  }
  const lotes = await Lote.findByFinca(req.params.fincaId);
  res.json(lotes);
});

const obtener = asyncHandler(async (req, res) => {
  const lote = await Lote.findByIdWithCosechas(req.params.id);
  if (!lote) return res.status(404).json({ error: 'Lote no encontrado' });
  const finca = await Finca.findById(lote.finca_id);
  if (!finca || finca.usuario_id !== req.usuario.id) {
    return res.status(404).json({ error: 'Lote no encontrado' });
  }
  res.json(lote);
});

const crear = asyncHandler(async (req, res) => {
  const finca = await Finca.findById(req.body.finca_id);
  if (!finca || finca.usuario_id !== req.usuario.id) {
    return res.status(404).json({ error: 'Finca no encontrada' });
  }
  const lote = await Lote.create(req.body);
  res.status(201).json(lote);
});

const actualizar = asyncHandler(async (req, res) => {
  const lote = await Lote.findById(req.params.id);
  if (!lote) return res.status(404).json({ error: 'Lote no encontrado' });
  const finca = await Finca.findById(lote.finca_id);
  if (!finca || finca.usuario_id !== req.usuario.id) {
    return res.status(404).json({ error: 'Lote no encontrado' });
  }
  const updated = await Lote.update(req.params.id, req.body);
  res.json(updated);
});

const eliminar = asyncHandler(async (req, res) => {
  const lote = await Lote.findById(req.params.id);
  if (!lote) return res.status(404).json({ error: 'Lote no encontrado' });
  const finca = await Finca.findById(lote.finca_id);
  if (!finca || finca.usuario_id !== req.usuario.id) {
    return res.status(404).json({ error: 'Lote no encontrado' });
  }
  await Lote.update(req.params.id, { activo: false });
  res.json({ message: 'Lote eliminado' });
});

module.exports = { listarPorFinca, obtener, crear, actualizar, eliminar };
