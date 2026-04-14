const { body, param, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos inválidos',
      detalles: errors.array().map(e => ({ campo: e.path, mensaje: e.msg })),
    });
  }
  next();
};

const uuidParam = param('id').isUUID().withMessage('ID inválido');

const usuarioValidators = {
  registro: [
    body('nombre').trim().notEmpty().withMessage('Nombre requerido').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
    body('telefono').optional().trim().isLength({ max: 20 }),
    validate,
  ],
  login: [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('Contraseña requerida'),
    validate,
  ],
};

const fincaValidators = {
  crear: [
    body('nombre').trim().notEmpty().withMessage('Nombre requerido').isLength({ max: 100 }),
    body('ubicacion').optional().trim().isLength({ max: 200 }),
    body('municipio').optional().trim().isLength({ max: 100 }),
    body('departamento').optional().trim().isLength({ max: 100 }),
    body('area_total').optional().isFloat({ min: 0 }).withMessage('Área debe ser positiva'),
    body('altitud').optional().isInt({ min: 0 }).withMessage('Altitud debe ser positiva'),
    validate,
  ],
};

const loteValidators = {
  crear: [
    body('finca_id').isUUID().withMessage('ID de finca inválido'),
    body('nombre').trim().notEmpty().withMessage('Nombre requerido').isLength({ max: 100 }),
    body('area').optional().isFloat({ min: 0 }),
    body('tipo_suelo').optional().trim().isLength({ max: 100 }),
    validate,
  ],
};

const cosechaValidators = {
  crear: [
    body('lote_id').isUUID().withMessage('ID de lote inválido'),
    body('variedad_papa').trim().notEmpty().withMessage('Variedad requerida').isLength({ max: 100 }),
    body('fecha_siembra').isISO8601().withMessage('Fecha de siembra inválida'),
    body('fecha_cosecha_estimada').optional().isISO8601(),
    body('area_sembrada').optional().isFloat({ min: 0 }),
    body('cantidad_semilla').optional().isFloat({ min: 0 }),
    validate,
  ],
  actualizarProduccion: [
    body('produccion_primera').optional().isFloat({ min: 0 }),
    body('produccion_segunda').optional().isFloat({ min: 0 }),
    body('produccion_tercera').optional().isFloat({ min: 0 }),
    body('produccion_descarte').optional().isFloat({ min: 0 }),
    body('perdidas').optional().isFloat({ min: 0 }),
    validate,
  ],
};

const actividadValidators = {
  crear: [
    body('cosecha_id').isUUID().withMessage('ID de cosecha inválido'),
    body('tipo').isIn(['siembra', 'fertilizacion', 'fumigacion', 'riego', 'cosecha', 'otro']).withMessage('Tipo inválido'),
    body('fecha').isISO8601().withMessage('Fecha inválida'),
    body('descripcion').optional().trim(),
    body('costo').optional().isFloat({ min: 0 }),
    validate,
  ],
};

const gastoValidators = {
  crear: [
    body('cosecha_id').isUUID().withMessage('ID de cosecha inválido'),
    body('tipo').isIn(['insumos', 'mano_de_obra', 'transporte', 'maquinaria', 'arriendo', 'otro']).withMessage('Tipo inválido'),
    body('concepto').trim().notEmpty().withMessage('Concepto requerido'),
    body('cantidad').optional().isFloat({ min: 0 }),
    body('valor_unitario').isFloat({ min: 0 }).withMessage('Valor unitario requerido'),
    body('valor_total').isFloat({ min: 0 }).withMessage('Valor total requerido'),
    body('fecha').isISO8601().withMessage('Fecha inválida'),
    validate,
  ],
};

const ventaValidators = {
  crear: [
    body('cosecha_id').isUUID().withMessage('ID de cosecha inválido'),
    body('fecha').isISO8601().withMessage('Fecha inválida'),
    body('cliente').trim().notEmpty().withMessage('Cliente requerido'),
    body('calidad').isIn(['primera', 'segunda', 'tercera', 'descarte']).withMessage('Calidad inválida'),
    body('cantidad_kg').isFloat({ min: 0.1 }).withMessage('Cantidad requerida'),
    body('precio_por_kg').isFloat({ min: 0 }).withMessage('Precio requerido'),
    body('valor_total').isFloat({ min: 0 }).withMessage('Valor total requerido'),
    validate,
  ],
};

module.exports = {
  validate, uuidParam,
  usuarioValidators, fincaValidators, loteValidators,
  cosechaValidators, actividadValidators, gastoValidators, ventaValidators,
};
