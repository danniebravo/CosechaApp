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

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
