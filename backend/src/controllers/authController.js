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

const perfil = asyncHandler(async (req, res) => {
  const usuario = await AuthService.getPerfil(req.usuario.id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(usuario);
});

module.exports = { registrar, login, perfil };
