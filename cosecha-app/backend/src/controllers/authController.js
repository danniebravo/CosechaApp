const AuthService = require('../services/AuthService');
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

module.exports = {
  registrar, login, loginGoogle, sendLoginOtp, verifyLoginOtp,
  perfil, forgotPassword, forgotByPhone, verifyOtp, resetPassword,
};
