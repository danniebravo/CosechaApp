const AuthService = require('../services/AuthService');
const Usuario = require('../models/Usuario');
const { asyncHandler } = require('../utils/helpers');

const registrar = asyncHandler(async (req, res) => {
  const result = await AuthService.registrar(req.body);
  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const result = await AuthService.login(req.body);
  res.json(result);
});

const loginGoogle = asyncHandler(async (req, res) => {
  const result = await AuthService.loginGoogle(req.body.id_token);
  res.json(result);
});

const sendLoginOtp = asyncHandler(async (req, res) => {
  const result = await AuthService.sendLoginOtp(req.body.phone);
  res.json(result);
});

const verifyLoginOtp = asyncHandler(async (req, res) => {
  const result = await AuthService.verifyLoginOtp(req.body.phone, req.body.otp);
  res.json(result);
});

const perfil = asyncHandler(async (req, res) => {
  const usuario = await AuthService.getPerfil(req.usuario.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(usuario);
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await AuthService.forgotPassword(req.body.email);
  res.json(result);
});

const forgotByPhone = asyncHandler(async (req, res) => {
  const result = await AuthService.forgotByPhone(req.body.phone);
  res.json(result);
});

const verifyOtp = asyncHandler(async (req, res) => {
  const result = await AuthService.verifyOtp(req.body.phone, req.body.otp);
  res.json(result);
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await AuthService.resetPassword(req.body.token, req.body.password);
  res.json(result);
});

// ═══════════════════════════════════════════
// ENDPOINTS DE DESARROLLO (solo NODE_ENV !== 'production')
// Permiten probar el flujo de bloqueo sin esperar 15 minutos.
// Gateados en routes/index.js
// ═══════════════════════════════════════════

const devAttemptsStatus = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email requerido en query string' });

  const user = await Usuario.findByEmail(email);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const lockStatus = Usuario.isLocked(user);
  res.json({
    email: user.email,
    failed_login_attempts: user.failed_login_attempts || 0,
    max_attempts: Usuario.MAX_LOGIN_ATTEMPTS,
    remaining: Math.max(Usuario.MAX_LOGIN_ATTEMPTS - (user.failed_login_attempts || 0), 0),
    locked: lockStatus.locked,
    locked_until: user.locked_until,
    minutes_remaining: lockStatus.minutes_remaining,
  });
});

const devResetAttempts = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email requerido' });

  const user = await Usuario.findByEmail(email);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  await Usuario.resetFailedAttempts(user.id);
  res.json({
    message: `Intentos y bloqueo reseteados para ${email}`,
    email: user.email,
  });
});

module.exports = {
  registrar, login, loginGoogle, sendLoginOtp, verifyLoginOtp,
  perfil, forgotPassword, forgotByPhone, verifyOtp, resetPassword,
  devAttemptsStatus, devResetAttempts,
};
