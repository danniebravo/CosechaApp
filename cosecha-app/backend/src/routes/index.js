const { Router } = require('express');
const { auth } = require('../middlewares/auth');
const {
  usuarioValidators, fincaValidators, loteValidators,
  cosechaValidators, actividadValidators, gastoValidators, ventaValidators,
} = require('../middlewares/validators');

const authCtrl = require('../controllers/authController');
const onboardingCtrl = require('../controllers/onboardingController');
const fincasCtrl = require('../controllers/fincasController');
const lotesCtrl = require('../controllers/lotesController');
const cosechasCtrl = require('../controllers/cosechasController');
const actividadesCtrl = require('../controllers/actividadesController');
const gastosCtrl = require('../controllers/gastosController');
const ventasCtrl = require('../controllers/ventasController');

const router = Router();

// ── Health check ──
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Auth ──
router.post('/auth/registro', usuarioValidators.registro, authCtrl.registrar);
router.post('/auth/login', usuarioValidators.login, authCtrl.login);
router.post('/auth/login-google', usuarioValidators.loginGoogle, authCtrl.loginGoogle);
router.post('/auth/send-login-otp', usuarioValidators.sendLoginOtp, authCtrl.sendLoginOtp);
router.post('/auth/verify-login-otp', usuarioValidators.verifyLoginOtp, authCtrl.verifyLoginOtp);
router.get('/auth/perfil', auth, authCtrl.perfil);
router.post('/auth/forgot-password', usuarioValidators.forgotPassword, authCtrl.forgotPassword);
router.post('/auth/forgot-by-phone', usuarioValidators.forgotByPhone, authCtrl.forgotByPhone);
router.post('/auth/verify-otp', usuarioValidators.verifyOtp, authCtrl.verifyOtp);
router.post('/auth/reset-password', usuarioValidators.resetPassword, authCtrl.resetPassword);

// ── Dev-only: ayudantes para probar el bloqueo por intentos fallidos ──
if (process.env.NODE_ENV !== 'production') {
  router.get ('/auth/dev/attempts',        authCtrl.devAttemptsStatus);
  router.post('/auth/dev/reset-attempts',  authCtrl.devResetAttempts);
}

// ── Onboarding ──
router.post('/onboarding', auth, onboardingCtrl.completar);
router.get('/onboarding/status', auth, onboardingCtrl.status);

// ── Fincas ──
router.get('/fincas', auth, fincasCtrl.listar);
router.get('/fincas/:id', auth, fincasCtrl.obtener);
router.post('/fincas', auth, fincaValidators.crear, fincasCtrl.crear);
router.put('/fincas/:id', auth, fincaValidators.crear, fincasCtrl.actualizar);
router.delete('/fincas/:id', auth, fincasCtrl.eliminar);

// ── Lotes ──
router.get('/fincas/:fincaId/lotes', auth, lotesCtrl.listarPorFinca);
router.get('/lotes/:id', auth, lotesCtrl.obtener);
router.post('/lotes', auth, loteValidators.crear, lotesCtrl.crear);
router.put('/lotes/:id', auth, lotesCtrl.actualizar);
router.delete('/lotes/:id', auth, lotesCtrl.eliminar);

// ── Cosechas ──
router.get('/cosechas', auth, cosechasCtrl.listar);
router.get('/cosechas/estadisticas', auth, cosechasCtrl.estadisticas);
router.get('/cosechas/dashboard', auth, cosechasCtrl.dashboard);
router.get('/cosechas/:id', auth, cosechasCtrl.obtener);
router.post('/cosechas', auth, cosechaValidators.crear, cosechasCtrl.crear);
router.put('/cosechas/:id', auth, cosechasCtrl.actualizar);
router.delete('/cosechas/:id', auth, cosechasCtrl.eliminar);

// ── Actividades ──
router.get('/cosechas/:cosechaId/actividades', auth, actividadesCtrl.listar);
router.post('/actividades', auth, actividadValidators.crear, actividadesCtrl.crear);
router.put('/actividades/:id', auth, actividadesCtrl.actualizar);
router.delete('/actividades/:id', auth, actividadesCtrl.eliminar);

// ── Gastos ──
router.get('/cosechas/:cosechaId/gastos', auth, gastosCtrl.listar);
router.get('/cosechas/:cosechaId/gastos/resumen', auth, gastosCtrl.resumen);
router.post('/gastos', auth, gastoValidators.crear, gastosCtrl.crear);
router.put('/gastos/:id', auth, gastosCtrl.actualizar);
router.delete('/gastos/:id', auth, gastosCtrl.eliminar);

// ── Ventas ──
router.get('/cosechas/:cosechaId/ventas', auth, ventasCtrl.listar);
router.get('/cosechas/:cosechaId/ventas/resumen', auth, ventasCtrl.resumen);
router.post('/ventas', auth, ventaValidators.crear, ventasCtrl.crear);
router.put('/ventas/:id', auth, ventasCtrl.actualizar);
router.delete('/ventas/:id', auth, ventasCtrl.eliminar);

module.exports = router;
