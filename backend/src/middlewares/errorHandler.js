const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Ya existe un registro con esos datos',
      detalle: err.detail,
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Referencia inválida, el registro relacionado no existe',
    });
  }

  if (err.code === '22P02') {
    return res.status(400).json({ error: 'Formato de dato inválido' });
  }

  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';

  // Propaga metadata útil (p. ej. estado de bloqueo del login)
  // para que el frontend pueda renderizar acciones contextuales.
  const extra = {};
  if (err.locked !== undefined)             extra.locked = err.locked;
  if (err.minutes_remaining !== undefined)  extra.minutes_remaining = err.minutes_remaining;
  if (err.attempts_remaining !== undefined) extra.attempts_remaining = err.attempts_remaining;

  res.status(status).json({
    error: message,
    ...extra,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
