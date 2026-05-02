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

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

// Reglas de dígitos por prefijo de país (debe coincidir con frontend)
const DIGITOS_POR_PREFIJO = {
  '+57': { digitos: 10, pais: 'Colombia' },
  '+1': { digitos: 10, pais: 'Estados Unidos' },
  '+52': { digitos: 10, pais: 'México' },
  '+34': { digitos: 9, pais: 'España' },
  '+51': { digitos: 9, pais: 'Perú' },
  '+593': { digitos: 9, pais: 'Ecuador' },
  '+58': { digitos: 10, pais: 'Venezuela' },
  '+56': { digitos: 9, pais: 'Chile' },
  '+54': { digitos: 10, pais: 'Argentina' },
  '+55': { digitos: 11, pais: 'Brasil' },
  '+507': { digitos: 8, pais: 'Panamá' },
  '+506': { digitos: 8, pais: 'Costa Rica' },
  '+502': { digitos: 8, pais: 'Guatemala' },
  '+503': { digitos: 8, pais: 'El Salvador' },
  '+504': { digitos: 8, pais: 'Honduras' },
  '+505': { digitos: 8, pais: 'Nicaragua' },
  '+591': { digitos: 8, pais: 'Bolivia' },
  '+595': { digitos: 9, pais: 'Paraguay' },
  '+598': { digitos: 8, pais: 'Uruguay' },
  '+53': { digitos: 8, pais: 'Cuba' },
  '+1809': { digitos: 7, pais: 'Rep. Dominicana' },
};

const validarTelefono = (value, { req }) => {
  if (!value) return true; // telefono es opcional
  const prefijo = req.body.telefono_prefijo || '+57';
  const soloDigitos = value.replace(/\s/g, '');

  if (!/^\d+$/.test(soloDigitos)) {
    throw new Error('El teléfono solo debe contener números');
  }

  const config = DIGITOS_POR_PREFIJO[prefijo];
  if (config) {
    if (soloDigitos.length !== config.digitos) {
      throw new Error(`Para ${config.pais} el teléfono debe tener exactamente ${config.digitos} dígitos`);
    }
  } else {
    // Prefijo no registrado: validación genérica
    if (soloDigitos.length < 7 || soloDigitos.length > 15) {
      throw new Error('El teléfono debe tener entre 7 y 15 dígitos');
    }
  }
  return true;
};

const usuarioValidators = {
  registro: [
    body('nombre').trim().notEmpty().withMessage('Nombre requerido').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('La contraseña debe tener mínimo 8 caracteres')
      .matches(/[a-z]/).withMessage('La contraseña debe tener al menos una minúscula')
      .matches(/[A-Z]/).withMessage('La contraseña debe tener al menos una mayúscula')
      .matches(/[0-9]/).withMessage('La contraseña debe tener al menos un número')
      .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('La contraseña debe tener al menos un carácter especial'),
    body('telefono_prefijo').optional().trim().matches(/^\+\d{1,4}$/).withMessage('Prefijo inválido'),
    body('telefono').optional({ checkFalsy: true }).trim().custom(validarTelefono),
    validate,
  ],
  login: [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('Contraseña requerida'),
    validate,
  ],
  loginGoogle: [
    body('id_token').notEmpty().withMessage('Token de Google requerido'),
    validate,
  ],
  loginApple: [
    body('identity_token').notEmpty().withMessage('Token de Apple requerido'),
    body('full_name').optional(),
    validate,
  ],
  sendLoginOtp: [
    body('phone').trim().notEmpty().withMessage('Número requerido')
      .matches(/^\+\d{7,20}$/).withMessage('Formato inválido'),
    validate,
  ],
  verifyLoginOtp: [
    body('phone').trim().notEmpty().withMessage('Teléfono requerido'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Código de 6 dígitos')
      .isNumeric().withMessage('Solo números'),
    validate,
  ],
  forgotPassword: [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    validate,
  ],
  forgotByPhone: [
    body('phone').trim().notEmpty().withMessage('Número de teléfono requerido')
      .matches(/^\+\d{7,20}$/).withMessage('Formato inválido. Ej: +573001234567'),
    validate,
  ],
  verifyOtp: [
    body('phone').trim().notEmpty().withMessage('Teléfono requerido'),
    body('otp').trim().notEmpty().withMessage('Código requerido')
      .isLength({ min: 6, max: 6 }).withMessage('El código debe tener 6 dígitos')
      .isNumeric().withMessage('El código debe ser numérico'),
    validate,
  ],
  resetPassword: [
    body('token').notEmpty().withMessage('Token requerido'),
    body('password')
      .isLength({ min: 8 }).withMessage('La contraseña debe tener mínimo 8 caracteres')
      .matches(/[a-z]/).withMessage('La contraseña debe tener al menos una minúscula')
      .matches(/[A-Z]/).withMessage('La contraseña debe tener al menos una mayúscula')
      .matches(/[0-9]/).withMessage('La contraseña debe tener al menos un número')
      .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('La contraseña debe tener al menos un carácter especial'),
    validate,
  ],
  verifyEmail: [
    body('otp').trim().notEmpty().withMessage('Código requerido')
      .isLength({ min: 6, max: 6 }).withMessage('El código debe tener 6 dígitos')
      .isNumeric().withMessage('El código debe ser numérico'),
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

// ── Trabajadores ──
const trabajadorValidators = {
  crear: [
    body('nombre').trim().notEmpty().withMessage('Nombre requerido').isLength({ max: 150 }),
    body('telefono').optional().trim().isLength({ max: 20 }),
    body('documento').optional().trim().isLength({ max: 30 }),
    validate,
  ],
  asignar: [
    body('cosecha_id').isUUID().withMessage('ID de cosecha inválido'),
    body('trabajador_id').isUUID().withMessage('ID de trabajador inválido'),
    body('modalidad').optional().isIn(['dia', 'hora', 'bulto']).withMessage('Modalidad inválida'),
    body('valor_dia').optional().isFloat({ min: 0 }),
    body('valor_hora').optional().isFloat({ min: 0 }),
    body('valor_bulto').optional().isFloat({ min: 0 }),
    validate,
  ],
};

// ── Jornadas ──
const jornadaValidators = {
  crear: [
    body('cosecha_id').isUUID().withMessage('ID de cosecha inválido'),
    body('trabajador_id').isUUID().withMessage('ID de trabajador inválido'),
    body('fecha').isISO8601().withMessage('Fecha inválida'),
    body('horas_trabajadas').optional().isFloat({ min: 0, max: 24 }),
    body('bultos_cosechados').optional().isFloat({ min: 0 }),
    body('valor_dia').isFloat({ min: 0 }).withMessage('Valor día requerido'),
    body('valor_comida').optional().isFloat({ min: 0 }),
    body('subtotal_pago').isFloat({ min: 0 }).withMessage('Subtotal requerido'),
    validate,
  ],
};

// ── Insumos ──
const insumoValidators = {
  crear: [
    body('cosecha_id').isUUID().withMessage('ID de cosecha inválido'),
    body('tipo').isIn(['semilla', 'abono', 'insecticida', 'fungicida', 'herbicida', 'desinfectante', 'fertilizante', 'otro']).withMessage('Tipo inválido'),
    body('nombre').trim().notEmpty().withMessage('Nombre requerido').isLength({ max: 200 }),
    body('cantidad').isFloat({ min: 0.01 }).withMessage('Cantidad requerida'),
    body('unidad').trim().notEmpty().withMessage('Unidad requerida'),
    body('valor_unitario').isFloat({ min: 0 }).withMessage('Valor unitario requerido'),
    body('valor_total').isFloat({ min: 0 }).withMessage('Valor total requerido'),
    body('fecha').isISO8601().withMessage('Fecha inválida'),
    body('fase').optional().isIn(['pre_siembra', 'siembra', 'desarrollo', 'cosecha', 'post_cosecha']),
    validate,
  ],
};

// ── Empaques ──
const empaqueValidators = {
  crear: [
    body('cosecha_id').isUUID().withMessage('ID de cosecha inválido'),
    body('tipo').isIn(['saco', 'cabulla', 'bolsa_plastica', 'otro']).withMessage('Tipo inválido'),
    body('descripcion').trim().notEmpty().withMessage('Descripción requerida'),
    body('cantidad').isInt({ min: 1 }).withMessage('Cantidad requerida'),
    body('valor_unitario').isFloat({ min: 0 }).withMessage('Valor unitario requerido'),
    body('valor_total').isFloat({ min: 0 }).withMessage('Valor total requerido'),
    body('fecha').isISO8601().withMessage('Fecha inválida'),
    validate,
  ],
};

// ── Fletes ──
const fleteValidators = {
  crear: [
    body('cosecha_id').isUUID().withMessage('ID de cosecha inválido'),
    body('fecha').isISO8601().withMessage('Fecha inválida'),
    body('cantidad_bultos').optional().isFloat({ min: 0 }),
    body('cantidad_kilos').optional().isFloat({ min: 0 }),
    body('valor_total').isFloat({ min: 0 }).withMessage('Valor total requerido'),
    validate,
  ],
};

// ── Procesos de cultivo ──
const procesoValidators = {
  crear: [
    body('cosecha_id').isUUID().withMessage('ID de cosecha inválido'),
    body('tipo').isIn(['melgar', 'arada', 'surcada', 'desinfeccion', 'tapada', 'aporque', 'otro']).withMessage('Tipo inválido'),
    body('fecha').isISO8601().withMessage('Fecha inválida'),
    body('costo').isFloat({ min: 0 }).withMessage('Costo requerido'),
    body('duracion_horas').optional().isFloat({ min: 0 }),
    validate,
  ],
};

// ── Amedieros ──
const amedieroValidators = {
  crear: [
    body('cosecha_id').isUUID().withMessage('ID de cosecha inválido'),
    body('nombre').trim().notEmpty().withMessage('Nombre requerido').isLength({ max: 150 }),
    body('porcentaje_inversion').isFloat({ min: 0, max: 100 }).withMessage('Porcentaje inversión inválido (0-100)'),
    body('porcentaje_ganancia').isFloat({ min: 0, max: 100 }).withMessage('Porcentaje ganancia inválido (0-100)'),
    body('descripcion_aporte').optional().trim(),
    validate,
  ],
};

module.exports = {
  validate, uuidParam,
  usuarioValidators, fincaValidators, loteValidators,
  cosechaValidators, actividadValidators, gastoValidators, ventaValidators,
  trabajadorValidators, jornadaValidators, insumoValidators,
  empaqueValidators, fleteValidators, procesoValidators, amedieroValidators,
};
