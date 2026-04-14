const { Finca, Lote } = require('../models');
const Usuario = require('../models/Usuario');
const { asyncHandler } = require('../utils/helpers');

/**
 * POST /api/onboarding
 * Crea finca + lote en una sola operacion.
 * Lat/lng son opcionales — el usuario puede agregarlas despues editando la finca.
 */
const completar = asyncHandler(async (req, res) => {
  const { finca: fincaData, lote: loteData } = req.body;
  const usuarioId = req.usuario.id;

  // ── Validar datos de finca ──
  if (!fincaData?.nombre?.trim()) {
    return res.status(400).json({ error: 'Nombre de finca requerido', campo: 'finca.nombre' });
  }
  if (!fincaData?.departamento?.trim()) {
    return res.status(400).json({ error: 'Departamento requerido', campo: 'finca.departamento' });
  }
  if (!fincaData?.municipio?.trim()) {
    return res.status(400).json({ error: 'Municipio requerido', campo: 'finca.municipio' });
  }

  // ── Validar datos de lote ──
  if (!loteData?.nombre?.trim()) {
    return res.status(400).json({ error: 'Nombre de lote requerido', campo: 'lote.nombre' });
  }

  // ── Coordenadas opcionales ──
  let latitud = null;
  let longitud = null;
  if (fincaData.latitud != null && fincaData.longitud != null) {
    latitud = parseFloat(fincaData.latitud);
    longitud = parseFloat(fincaData.longitud);
    if (isNaN(latitud) || isNaN(longitud)) {
      latitud = null;
      longitud = null;
    }
  }

  // ── Crear finca ──
  const fincaPayload = {
    nombre: fincaData.nombre.trim(),
    departamento: fincaData.departamento.trim(),
    municipio: fincaData.municipio.trim(),
    ubicacion: fincaData.ubicacion?.trim() || null,
    area_total: fincaData.area_total || null,
    altitud: fincaData.altitud || null,
    usuario_id: usuarioId,
  };
  if (latitud !== null) fincaPayload.latitud = latitud;
  if (longitud !== null) fincaPayload.longitud = longitud;

  const finca = await Finca.create(fincaPayload);

  // ── Crear lote asociado ──
  const lote = await Lote.create({
    nombre: loteData.nombre.trim(),
    area: loteData.area || null,
    tipo_suelo: loteData.tipo_suelo?.trim() || null,
    finca_id: finca.id,
  });

  // ── Verificar onboarding completo ──
  const onboarding_completed = await Usuario.checkOnboarding(usuarioId);

  res.status(201).json({
    message: 'Onboarding completado',
    finca,
    lote,
    onboarding_completed,
  });
});

/**
 * GET /api/onboarding/status
 */
const status = asyncHandler(async (req, res) => {
  const onboarding_completed = await Usuario.checkOnboarding(req.usuario.id);
  res.json({ onboarding_completed });
});

module.exports = { completar, status };
