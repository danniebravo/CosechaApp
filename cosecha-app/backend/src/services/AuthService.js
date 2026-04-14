const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

class AuthService {
  async registrar({ nombre, email, password, telefono, telefono_prefijo }) {
    const existe = await Usuario.findByEmail(email);
    if (existe) {
      const err = new Error('Ya existe una cuenta con este email');
      err.status = 409;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Concatenar prefijo + número sin espacios → "+573001234567"
    let telefonoCompleto = null;
    if (telefono && telefono.trim()) {
      const prefijo = telefono_prefijo || '+57';
      const numero = telefono.replace(/\s/g, '');
      telefonoCompleto = `${prefijo}${numero}`;
    }

    const usuario = await Usuario.create({
      nombre, email, password_hash, telefono: telefonoCompleto,
    });

    const token = this.generarToken(usuario);

    // Usuario recién creado → onboarding siempre false
    return {
      usuario: {
        id: usuario.id, nombre: usuario.nombre, email: usuario.email,
        rol: usuario.rol, onboarding_completed: false,
      },
      token,
    };
  }

  async login({ email, password }) {
    const usuario = await Usuario.findByEmail(email);
    if (!usuario) {
      const err = new Error('Email o contraseña incorrectos');
      err.status = 401;
      throw err;
    }

    if (!usuario.activo) {
      const err = new Error('Cuenta desactivada');
      err.status = 403;
      throw err;
    }

    const match = await bcrypt.compare(password, usuario.password_hash);
    if (!match) {
      const err = new Error('Email o contraseña incorrectos');
      err.status = 401;
      throw err;
    }

    const token = this.generarToken(usuario);

    // Calcular onboarding dinámicamente
    const onboarding_completed = await Usuario.checkOnboarding(usuario.id);

    return {
      usuario: {
        id: usuario.id, nombre: usuario.nombre, email: usuario.email,
        rol: usuario.rol, onboarding_completed,
      },
      token,
    };
  }

  generarToken(usuario) {
    return jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  async getPerfil(id) {
    const usuario = await Usuario.findByIdSafe(id);
    if (!usuario) return null;

    const onboarding_completed = await Usuario.checkOnboarding(id);
    return { ...usuario, onboarding_completed };
  }
}

module.exports = new AuthService();
