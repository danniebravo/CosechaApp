const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const Usuario = require('../models/Usuario');
const emailService = require('./EmailService');
const smsService = require('./SmsService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {

  // ═══════════════════════════════════════════
  // REGISTRO
  // ═══════════════════════════════════════════

  async registrar({ nombre, email, password, telefono, telefono_prefijo }) {
    const existe = await Usuario.findByEmail(email);
    if (existe) {
      const err = new Error('Ya existe una cuenta con este email');
      err.status = 409;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    let telefonoCompleto = null;
    if (telefono && telefono.trim()) {
      const prefijo = telefono_prefijo || '+57';
      const numero = telefono.replace(/\s/g, '');
      telefonoCompleto = `${prefijo}${numero}`;
    }

    const usuario = await Usuario.create({
      nombre, email, password_hash, telefono: telefonoCompleto, auth_provider: 'local',
    });

    const token = this.generarToken(usuario);
    return {
      usuario: {
        id: usuario.id, nombre: usuario.nombre, email: usuario.email,
        rol: usuario.rol, onboarding_completed: false,
      },
      token,
    };
  }

  // ═══════════════════════════════════════════
  // LOGIN CON EMAIL + PASSWORD
  // ═══════════════════════════════════════════

  async login({ email, password }) {
    const usuario = await Usuario.findByEmail(email);

    if (!usuario) {
      const err = new Error('El correo o la contrasena no coinciden');
      err.status = 401;
      throw err;
    }

    if (!usuario.activo) {
      const err = new Error('Cuenta desactivada');
      err.status = 403;
      throw err;
    }

    // Si la cuenta es de Google y no tiene password
    if (usuario.auth_provider === 'google' && !usuario.password_hash) {
      const err = new Error('Esta cuenta usa Google para iniciar sesion. Usa el boton "Continuar con Google".');
      err.status = 400;
      throw err;
    }

    // Verificar bloqueo temporal
    const lockStatus = Usuario.isLocked(usuario);
    if (lockStatus.locked) {
      const err = new Error(
        `Tu acceso esta temporalmente bloqueado. Intenta en ${lockStatus.minutes_remaining} minuto(s) o recupera tu contrasena.`
      );
      err.status = 423;
      err.locked = true;
      throw err;
    }

    const match = await bcrypt.compare(password, usuario.password_hash);
    if (!match) {
      const attempts = await Usuario.incrementFailedAttempts(usuario.id);
      const remaining = Usuario.MAX_LOGIN_ATTEMPTS - attempts;

      let message = 'El correo o la contrasena no coinciden';
      let status = 401;

      if (remaining > 0 && remaining <= 2) {
        message = `Contrasena incorrecta. Te quedan ${remaining} intento(s) antes del bloqueo.`;
      } else if (remaining <= 0) {
        message = `Cuenta bloqueada temporalmente por ${Usuario.LOCK_DURATION_MINUTES} minutos.`;
        status = 423;
      }

      const err = new Error(message);
      err.status = status;
      if (status === 423) err.locked = true;
      throw err;
    }

    if (usuario.failed_login_attempts > 0 || usuario.locked_until) {
      await Usuario.resetFailedAttempts(usuario.id);
    }

    return this._buildLoginResponse(usuario);
  }

  // ═══════════════════════════════════════════
  // LOGIN CON GOOGLE
  // ═══════════════════════════════════════════

  async loginGoogle(idToken) {
    // Verificar token con Google
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      const err = new Error('Token de Google invalido');
      err.status = 401;
      throw err;
    }

    const { sub: googleId, email, name, picture } = payload;

    // 1. Buscar por google_id
    let usuario = await Usuario.findByGoogleId(googleId);

    if (!usuario) {
      // 2. Buscar por email — vincular cuenta existente
      usuario = await Usuario.findByEmail(email);

      if (usuario) {
        // Vincular Google a cuenta existente
        await Usuario.update(usuario.id, { google_id: googleId });
      } else {
        // 3. Crear cuenta nueva
        usuario = await Usuario.create({
          nombre: name || email.split('@')[0],
          email,
          password_hash: null,
          google_id: googleId,
          auth_provider: 'google',
        });
      }
    }

    if (!usuario.activo) {
      const err = new Error('Cuenta desactivada');
      err.status = 403;
      throw err;
    }

    // Resetear cualquier bloqueo
    if (usuario.failed_login_attempts > 0 || usuario.locked_until) {
      await Usuario.resetFailedAttempts(usuario.id);
    }

    return this._buildLoginResponse(usuario);
  }

  // ═══════════════════════════════════════════
  // LOGIN CON TELEFONO — PASO 1: ENVIAR OTP
  // ═══════════════════════════════════════════

  async sendLoginOtp(phone) {
    const MSG_OK = 'Si el numero esta registrado, recibiras un codigo.';

    const usuario = await Usuario.findByPhone(phone);
    if (!usuario || !usuario.activo) {
      return { message: MSG_OK };
    }

    const otp = await Usuario.createPhoneOtp(usuario.id);

    await smsService.sendOtp({ to: usuario.telefono, code: otp });

    return {
      message: MSG_OK,
      ...(process.env.NODE_ENV === 'development' && { _debug_otp: otp }),
    };
  }

  // ═══════════════════════════════════════════
  // LOGIN CON TELEFONO — PASO 2: VERIFICAR OTP Y LOGIN
  // ═══════════════════════════════════════════

  async verifyLoginOtp(phone, otp) {
    const usuario = await Usuario.findByPhone(phone);
    if (!usuario) {
      const err = new Error('Codigo invalido o expirado');
      err.status = 400;
      throw err;
    }

    const result = await Usuario.verifyPhoneOtp(usuario.id, otp);

    if (result.expired) {
      const err = new Error('El codigo ha expirado. Solicita uno nuevo.');
      err.status = 400;
      throw err;
    }
    if (result.maxAttempts) {
      const err = new Error('Demasiados intentos. Solicita un nuevo codigo.');
      err.status = 429;
      throw err;
    }
    if (!result.valid) {
      const err = new Error('Codigo incorrecto');
      err.status = 400;
      throw err;
    }

    await Usuario.clearPhoneOtp(usuario.id);

    // Login directo — el OTP reemplaza la contrasena
    return this._buildLoginResponse(usuario);
  }

  // ═══════════════════════════════════════════
  // FORGOT PASSWORD — POR EMAIL
  // ═══════════════════════════════════════════

  async forgotPassword(email) {
    const MSG_OK = 'Si el correo esta registrado, recibiras un enlace de recuperacion.';
    const usuario = await Usuario.findByEmail(email);

    if (!usuario || !usuario.activo) return { message: MSG_OK };

    const rawToken = await Usuario.createResetToken(usuario.id, 'email');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    await emailService.sendResetPassword({ to: usuario.email, nombre: usuario.nombre, resetUrl });

    return {
      message: MSG_OK,
      ...(process.env.NODE_ENV === 'development' && { _debug_url: resetUrl }),
    };
  }

  // ═══════════════════════════════════════════
  // FORGOT PASSWORD — POR CELULAR
  // ═══════════════════════════════════════════

  async forgotByPhone(phone) {
    const MSG_OK = 'Si el numero esta registrado, recibiras un codigo de verificacion.';
    const usuario = await Usuario.findByPhone(phone);

    if (!usuario || !usuario.activo) return { message: MSG_OK };

    const otp = await Usuario.createPhoneOtp(usuario.id);
    await smsService.sendOtp({ to: usuario.telefono, code: otp });

    return {
      message: MSG_OK,
      ...(process.env.NODE_ENV === 'development' && { _debug_otp: otp }),
    };
  }

  // ═══════════════════════════════════════════
  // VERIFICAR OTP (para forgot password)
  // ═══════════════════════════════════════════

  async verifyOtp(phone, otp) {
    const usuario = await Usuario.findByPhone(phone);
    if (!usuario) {
      const err = new Error('Codigo invalido o expirado');
      err.status = 400;
      throw err;
    }

    const result = await Usuario.verifyPhoneOtp(usuario.id, otp);

    if (result.expired) { const e = new Error('El codigo ha expirado.'); e.status = 400; throw e; }
    if (result.maxAttempts) { const e = new Error('Demasiados intentos.'); e.status = 429; throw e; }
    if (!result.valid) { const e = new Error('Codigo incorrecto'); e.status = 400; throw e; }

    const rawToken = await Usuario.createResetToken(usuario.id, 'phone');
    await Usuario.clearPhoneOtp(usuario.id);

    return { message: 'Codigo verificado', reset_token: rawToken };
  }

  // ═══════════════════════════════════════════
  // RESET PASSWORD
  // ═══════════════════════════════════════════

  async resetPassword(token, newPassword) {
    const usuario = await Usuario.findByResetToken(token);
    if (!usuario) {
      const err = new Error('El enlace de recuperacion es invalido o ya expiro.');
      err.status = 400;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    await Usuario.updatePassword(usuario.id, password_hash);

    return { message: 'Contrasena actualizada correctamente.' };
  }

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════

  async _buildLoginResponse(usuario) {
    const token = this.generarToken(usuario);
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
