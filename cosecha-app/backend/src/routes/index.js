const { Router } = require('express');
const { auth } = require('../middlewares/auth');
const {
  usuarioValidators, fincaValidators, loteValidators,
  cosechaValidators, actividadValidators, gastoValidators, ventaValidators,
  trabajadorValidators, jornadaValidators, insumoValidators,
  empaqueValidators, fleteValidators, procesoValidators, amedieroValidators,
} = require('../middlewares/validators');

const authCtrl = require('../controllers/authController');
const onboardingCtrl = require('../controllers/onboardingController');
const fincasCtrl = require('../controllers/fincasController');
const lotesCtrl = require('../controllers/lotesController');
const cosechasCtrl = require('../controllers/cosechasController');
const actividadesCtrl = require('../controllers/actividadesController');
const gastosCtrl = require('../controllers/gastosController');
const ventasCtrl = require('../controllers/ventasController');
const alertasCtrl = require('../controllers/alertasController');
const trabajadoresCtrl = require('../controllers/trabajadoresController');
const insumosCtrl = require('../controllers/insumosController');
const empaquesCtrl = require('../controllers/empaquesController');
const fletesCtrl = require('../controllers/fletesController');
const procesosCtrl = require('../controllers/procesosController');
const amedierosCtrl = require('../controllers/amedierosController');

const router = Router();

// ��─ Health check ──
router.get('/health', (req, res) => {
  const emailService = require('../services/EmailService');
  const smsService = require('../services/SmsService');
  res.json({
    status: 'ok',
    timestamp: new Date(),
    services: {
      email: emailService.isConfigured ? 'configured' : 'console-only',
      sms: smsService.isConfigured ? 'configured' : 'console-only',
    },
  });
});

// ══════════════════════════════════════════════
// AUTH
// ═════════��═════════════════════════��══════════
router.post('/auth/registro', usuarioValidators.registro, authCtrl.registrar);
router.post('/auth/login', usuarioValidators.login, authCtrl.login);
router.post('/auth/login-google', usuarioValidators.loginGoogle, authCtrl.loginGoogle);
router.post('/auth/login-apple', usuarioValidators.loginApple, authCtrl.loginApple);
router.post('/auth/send-login-otp', usuarioValidators.sendLoginOtp, authCtrl.sendLoginOtp);
router.post('/auth/verify-login-otp', usuarioValidators.verifyLoginOtp, authCtrl.verifyLoginOtp);
router.get('/auth/perfil', auth, authCtrl.perfil);
router.post('/auth/forgot-password', usuarioValidators.forgotPassword, authCtrl.forgotPassword);
router.post('/auth/forgot-by-phone', usuarioValidators.forgotByPhone, authCtrl.forgotByPhone);
router.post('/auth/verify-otp', usuarioValidators.verifyOtp, authCtrl.verifyOtp);
router.post('/auth/reset-password', usuarioValidators.resetPassword, authCtrl.resetPassword);

// ── Verificación de email ──
router.post('/auth/send-email-verification', auth, authCtrl.sendEmailVerification);
router.post('/auth/verify-email', auth, usuarioValidators.verifyEmail, authCtrl.verifyEmail);

if (process.env.NODE_ENV !== 'production') {
  router.get ('/auth/dev/attempts',       authCtrl.devAttemptsStatus);
  router.post('/auth/dev/reset-attempts', authCtrl.devResetAttempts);
}

// ══��════════════════════════════��══════════════
// ONBOARDING
// ══════════════════════════════════════════════
router.post('/onboarding', auth, onboardingCtrl.completar);
router.get('/onboarding/status', auth, onboardingCtrl.status);

// ═══════════════════════════════���══════════════
// FINCAS
// ════��═════════════════════════════════════════
router.get('/fincas', auth, fincasCtrl.listar);
router.get('/fincas/:id', auth, fincasCtrl.obtener);
router.post('/fincas', auth, fincaValidators.crear, fincasCtrl.crear);
router.put('/fincas/:id', auth, fincaValidators.crear, fincasCtrl.actualizar);
router.delete('/fincas/:id', auth, fincasCtrl.eliminar);

// ════��════════════════════��════════════════════
// LOTES
// ════════════════════════════════════════���═════
router.get('/fincas/:fincaId/lotes', auth, lotesCtrl.listarPorFinca);
router.get('/lotes/:id', auth, lotesCtrl.obtener);
router.post('/lotes', auth, loteValidators.crear, lotesCtrl.crear);
router.put('/lotes/:id', auth, loteValidators.crear, lotesCtrl.actualizar);
router.delete('/lotes/:id', auth, lotesCtrl.eliminar);

// ═���════════════════════════════���═══════════════
// COSECHAS
// ══════════════════════════════════════════════
router.get('/cosechas', auth, cosechasCtrl.listar);
router.get('/cosechas/estadisticas', auth, cosechasCtrl.estadisticas);
router.get('/cosechas/dashboard', auth, cosechasCtrl.dashboard);
router.get('/cosechas/calcular-fecha', auth, cosechasCtrl.calcularFecha);
router.get('/cosechas/:id/exportar', auth, cosechasCtrl.exportarExcel);
router.get('/cosechas/:id', auth, cosechasCtrl.obtener);
router.post('/cosechas', auth, cosechaValidators.crear, cosechasCtrl.crear);
router.put('/cosechas/:id', auth, cosechasCtrl.actualizar);
router.delete('/cosechas/:id', auth, cosechasCtrl.eliminar);

// ══════════════════════════════════════��═══════
// ACTIVIDADES
// ══════���═════════════════���═════════════════════
router.get('/cosechas/:cosechaId/actividades', auth, actividadesCtrl.listar);
router.post('/actividades', auth, actividadValidators.crear, actividadesCtrl.crear);
router.put('/actividades/:id', auth, actividadesCtrl.actualizar);
router.delete('/actividades/:id', auth, actividadesCtrl.eliminar);

// ═══════��════════════════════════════════��═════
// GASTOS
// ══════════════════════════════════════════════
router.get('/cosechas/:cosechaId/gastos', auth, gastosCtrl.listar);
router.get('/cosechas/:cosechaId/gastos/resumen', auth, gastosCtrl.resumen);
router.post('/gastos', auth, gastoValidators.crear, gastosCtrl.crear);
router.put('/gastos/:id', auth, gastosCtrl.actualizar);
router.delete('/gastos/:id', auth, gastosCtrl.eliminar);

// ═��═══════��════════════════════════════════════
// VENTAS
// ══════════════════════════════════════════════
router.get('/cosechas/:cosechaId/ventas', auth, ventasCtrl.listar);
router.get('/cosechas/:cosechaId/ventas/resumen', auth, ventasCtrl.resumen);
router.post('/ventas', auth, ventaValidators.crear, ventasCtrl.crear);
router.put('/ventas/:id', auth, ventasCtrl.actualizar);
router.delete('/ventas/:id', auth, ventasCtrl.eliminar);

// ══���═══════════════════════════════════════════
// ALERTAS (BUGFIX: antes no estaban conectadas)
// ════���═══════════════���═════════════════════════
router.get('/alertas', auth, alertasCtrl.listarPendientes);
router.get('/alertas/count', auth, alertasCtrl.contarPendientes);
router.post('/cosechas/:cosechaId/alertas/generar', auth, alertasCtrl.generarParaCosecha);
router.put('/alertas/:id/completar', auth, alertasCtrl.completar);
router.put('/alertas/:id/descartar', auth, alertasCtrl.descartar);

// ═══���══════════════════════════════════════════
// TRABAJADORES (maestro del usuario)
// ══════════════════════════════���═══════════════
router.get('/trabajadores', auth, trabajadoresCtrl.listar);
router.post('/trabajadores', auth, trabajadorValidators.crear, trabajadoresCtrl.crear);
router.put('/trabajadores/:id', auth, trabajadorValidators.crear, trabajadoresCtrl.actualizar);
router.delete('/trabajadores/:id', auth, trabajadoresCtrl.eliminar);

// ── Trabajadores por cosecha ──
router.get('/cosechas/:cosechaId/trabajadores', auth, trabajadoresCtrl.listarPorCosecha);
router.get('/cosechas/:cosechaId/trabajadores/resumen', auth, trabajadoresCtrl.resumenPorCosecha);
router.post('/cosechas/trabajadores/asignar', auth, trabajadorValidators.asignar, trabajadoresCtrl.asignar);
router.delete('/cosechas/:cosechaId/trabajadores/:trabajadorId', auth, trabajadoresCtrl.desasignar);

// ── Jornadas de trabajo ���─
router.get('/cosechas/:cosechaId/jornadas', auth, trabajadoresCtrl.listarJornadas);
router.get('/cosechas/:cosechaId/jornadas/resumen-diario', auth, trabajadoresCtrl.resumenDiario);
router.post('/jornadas', auth, jornadaValidators.crear, trabajadoresCtrl.crearJornada);
router.put('/jornadas/:id', auth, trabajadoresCtrl.actualizarJornada);
router.delete('/jornadas/:id', auth, trabajadoresCtrl.eliminarJornada);

// ════════���═════════════════════════════════���═══
// INSUMOS
// ══════════════════════════════════════════════
router.get('/cosechas/:cosechaId/insumos', auth, insumosCtrl.listar);
router.get('/cosechas/:cosechaId/insumos/resumen-tipo', auth, insumosCtrl.resumenPorTipo);
router.get('/cosechas/:cosechaId/insumos/resumen-fase', auth, insumosCtrl.resumenPorFase);
router.post('/insumos', auth, insumoValidators.crear, insumosCtrl.crear);
router.put('/insumos/:id', auth, insumosCtrl.actualizar);
router.delete('/insumos/:id', auth, insumosCtrl.eliminar);

// ═══════���══════════════════════════════════════
// EMPAQUES
// ═════════════��════════════════════════════════
router.get('/cosechas/:cosechaId/empaques', auth, empaquesCtrl.listar);
router.get('/cosechas/:cosechaId/empaques/resumen', auth, empaquesCtrl.resumen);
router.post('/empaques', auth, empaqueValidators.crear, empaquesCtrl.crear);
router.put('/empaques/:id', auth, empaquesCtrl.actualizar);
router.delete('/empaques/:id', auth, empaquesCtrl.eliminar);

// ═════════��══════════════════════��═════════════
// FLETES / TRANSPORTE
// ═════��═══════════════���════════════════════════
router.get('/cosechas/:cosechaId/fletes', auth, fletesCtrl.listar);
router.get('/cosechas/:cosechaId/fletes/resumen', auth, fletesCtrl.resumen);
router.post('/fletes', auth, fleteValidators.crear, fletesCtrl.crear);
router.put('/fletes/:id', auth, fletesCtrl.actualizar);
router.delete('/fletes/:id', auth, fletesCtrl.eliminar);

// ═════════════════════════════════���════════════
// PROCESOS DE CULTIVO
// ════��═════════════════════════════════════════
router.get('/cosechas/:cosechaId/procesos', auth, procesosCtrl.listar);
router.get('/cosechas/:cosechaId/procesos/resumen', auth, procesosCtrl.resumen);
router.post('/procesos', auth, procesoValidators.crear, procesosCtrl.crear);
router.put('/procesos/:id', auth, procesosCtrl.actualizar);
router.delete('/procesos/:id', auth, procesosCtrl.eliminar);

// ═════════════════��═══════════════════════���════
// AMEDIEROS / SOCIOS
// ══════════════════��═══════════════════════════
router.get('/cosechas/:cosechaId/amedieros', auth, amedierosCtrl.listar);
router.get('/cosechas/:cosechaId/amedieros/distribucion', auth, amedierosCtrl.distribucion);
router.post('/cosechas/:cosechaId/amedieros/recalcular', auth, amedierosCtrl.recalcular);
router.post('/amedieros', auth, amedieroValidators.crear, amedierosCtrl.crear);
router.put('/amedieros/:id', auth, amedierosCtrl.actualizar);
router.delete('/amedieros/:id', auth, amedierosCtrl.eliminar);

module.exports = router;
