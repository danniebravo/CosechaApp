const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { verifyAppleToken } = require('./AppleAuthService');
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
      nombre, email, password_hash, telefono: telefonoCompleto,
      auth_provider: 'local', email_verified: false,
    });

    // Enviar código de verificación al email
    const otp = await Usuario.createEmailOtp(usuario.id);
    await Usuario.registerResend(usuario.id, 'email_otp');
    await emailService.sendVerificationCode({ to: email, nombre, code: otp });

    const token = this.generarToken(usuario);
    return {
      usuario: {
        id: usuario.id, nombre: usuario.nombre, email: usuario.email,
        rol: usuario.rol, onboarding_completed: false, email_verified: false,
      },
      token,
      requires_verification: true,
      retry_after_seconds: Usuario.RESEND_COOLDOWNS.email_otp.progressive[0],
      ...(process.env.NODE_ENV === 'development' && { _debug_otp: otp }),
    };
  }

  // ═══════════════════════════════════════════
  // VERIFICACIÓN DE EMAIL
  // ═══════════════════════════════════════════

  async sendEmailVerification(usuarioId) {
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      const err = new Error('Usuario no encontrado'); err.status = 404; throw err;
    }

    if (usuario.email_verified) {
      return { message: 'El correo ya esta verificado', already_verified: true };
    }

    const check = Usuario.checkResendCooldown(usuario, 'email_otp');
    if (!check.allowed) {
      return {
        message: check.quota_exhausted
          ? 'Demasiados intentos. Intenta de nuevo mas tarde.'
          : 'Codigo enviado. Revisa tu correo.',
        retry_after_seconds: check.retry_after,
        quota_exhausted: check.quota_exhausted,
      };
    }

    const otp = await Usuario.createEmailOtp(usuario.id);
    await Usuario.registerResend(usuario.id, 'email_otp');
    await emailService.sendVerificationCode({
      to: usuario.email, nombre: usuario.nombre, code: otp,
    });

    return {
      message: 'Codigo enviado. Revisa tu correo.',
      retry_after_seconds: check.retry_after,
      ...(process.env.NODE_ENV === 'development' && { _debug_otp: otp }),
    };
  }

  async verifyEmail(usuarioId, otp) {
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      const err = new Error('Usuario no encontrado'); err.status = 404; throw err;
    }

    if (usuario.email_verified) {
      return { message: 'El correo ya esta verificado', verified: true };
    }

    const result = await Usuario.verifyEmailOtp(usuario.id, otp);

    if (result.expired) {
      const err = new Error('El codigo ha expirado. Solicita uno nuevo.');
      err.status = 400; throw err;
    }
    if (result.maxAttempts) {
      const err = new Error('Demasiados intentos. Solicita un nuevo codigo.');
      err.status = 429; throw err;
    }
    if (!result.valid) {
      const err = new Error('Codigo incorrecto');
      err.status = 400; throw err;
    }

    await Usuario.markEmailVerified(usuario.id);
    return { message: 'Correo verificado exitosamente', verified: true };
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

    // Verificar bloqueo temporal — bloquea incluso si la contraseña es correcta
    const lockStatus = Usuario.isLocked(usuario);
    if (lockStatus.locked) {
      const err = new Error(
        `Tu cuenta está bloqueada temporalmente. Intenta en ${lockStatus.minutes_remaining} minuto(s) o recupera tu contraseña.`
      );
      err.status = 423;
      err.locked = true;
      err.minutes_remaining = lockStatus.minutes_remaining;
      err.attempts_remaining = 0;
      throw err;
    }

    const match = await bcrypt.compare(password, usuario.password_hash);
    if (!match) {
      const attempts  = await Usuario.incrementFailedAttempts(usuario.id);
      const MAX       = Usuario.MAX_LOGIN_ATTEMPTS;
      const LOCK_MIN  = Usuario.LOCK_DURATION_MINUTES;
      const remaining = Math.max(MAX - attempts, 0);

      let message, status;
      if (attempts >= MAX) {
        // Bloqueo recién activado
        status  = 423;
        message = `Tu cuenta fue bloqueada temporalmente por varios intentos fallidos. Intenta en ${LOCK_MIN} minutos o recupera tu contraseña.`;
      } else if (remaining === 1) {
        // Última oportunidad antes del bloqueo
        status  = 401;
        message = 'Contraseña incorrecta. Te queda 1 intento antes del bloqueo.';
      } else {
        // Primer intento fallido — mensaje genérico (no revela si el correo existe)
        status  = 401;
        message = 'El correo o la contraseña no coinciden.';
      }

      const err = new Error(message);
      err.status = status;
      err.attempts_remaining = remaining;
      if (status === 423) {
        err.locked = true;
        err.minutes_remaining = LOCK_MIN;
      }
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
        // Vincular Google a cuenta existente + verificar email
        await Usuario.update(usuario.id, { google_id: googleId, email_verified: true });
      } else {
        // 3. Crear cuenta nueva (Google ya verificó el email)
        usuario = await Usuario.create({
          nombre: name || email.split('@')[0],
          email,
          password_hash: null,
          google_id: googleId,
          auth_provider: 'google',
          email_verified: true,
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
  // LOGIN CON APPLE
  // ═══════════════════════════════════════════

  async loginApple({ identityToken, fullName }) {
    const clientId = process.env.APPLE_CLIENT_ID || process.env.APPLE_SERVICE_ID;
    if (!clientId) {
      const err = new Error('Apple Sign In no esta configurado');
      err.status = 503;
      throw err;
    }

    let payload;
    try {
      payload = await verifyAppleToken(identityToken, clientId);
    } catch {
      const err = new Error('Token de Apple invalido');
      err.status = 401;
      throw err;
    }

    const { sub: appleId, email } = payload;

    // 1. Buscar por apple_id
    let usuario = await Usuario.findByAppleId(appleId);

    if (!usuario) {
      // 2. Buscar por email — vincular cuenta existente
      if (email) {
        usuario = await Usuario.findByEmail(email);
      }

      if (usuario) {
        // Vincular Apple a cuenta existente + verificar email
        await Usuario.update(usuario.id, { apple_id: appleId, email_verified: true });
      } else {
        // 3. Crear cuenta nueva
        // Apple solo envía el nombre en el PRIMER login, después no
        const nombre = fullName
          ? [fullName.givenName, fullName.familyName].filter(Boolean).join(' ')
          : (email ? email.split('@')[0] : 'Usuario');

        usuario = await Usuario.create({
          nombre,
          email: email || `apple_${appleId}@privaterelay.appleid.com`,
          password_hash: null,
          apple_id: appleId,
          auth_provider: 'apple',
          email_verified: true,
        });
      }
    }

    if (!usuario.activo) {
      const err = new Error('Cuenta desactivada');
      err.status = 403;
      throw err;
    }

    if (usuario.failed_login_attempts > 0 || usuario.locked_until) {
      await Usuario.resetFailedAttempts(usuario.id);
    }

    return this._buildLoginResponse(usuario);
  }

  // ═══════════════════════════════════════════
  // LOGIN CON TELEFONO — PASO 1: ENVIAR OTP
  // ═══════════════════════════════════════════

  async sendLoginOtp(phone) {
    const MSG_OK   = 'Si el numero esta registrado, recibiras un codigo.';
    const FALLBACK = Usuario.RESEND_COOLDOWNS.phone_otp.progressive[0];

    const usuario = await Usuario.findByPhone(phone);

    if (!usuario || !usuario.activo) {
      return { message: MSG_OK, retry_after_seconds: FALLBACK };
    }

    const check = Usuario.checkResendCooldown(usuario, 'phone_otp');
    if (!check.allowed) {
      return {
        message: check.quota_exhausted
          ? 'Demasiados intentos. Intenta de nuevo mas tarde.'
          : MSG_OK,
        retry_after_seconds: check.retry_after,
        quota_exhausted: check.quota_exhausted,
      };
    }

    const otp = await Usuario.createPhoneOtp(usuario.id);
    await Usuario.registerResend(usuario.id, 'phone_otp');
    await smsService.sendOtp({ to: usuario.telefono, code: otp });

    return {
      message: MSG_OK,
      retry_after_seconds: check.retry_after,
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
    const MSG_OK   = 'Si el correo esta registrado, recibiras un enlace de recuperacion.';
    const FALLBACK = Usuario.RESEND_COOLDOWNS.reset_email.progressive[0];

    const usuario = await Usuario.findByEmail(email);

    if (!usuario || !usuario.activo) {
      return { message: MSG_OK, retry_after_seconds: FALLBACK };
    }

    const check = Usuario.checkResendCooldown(usuario, 'reset_email');
    if (!check.allowed) {
      return {
        message: check.quota_exhausted
          ? 'Demasiados intentos. Intenta de nuevo mas tarde.'
          : MSG_OK,
        retry_after_seconds: check.retry_after,
        quota_exhausted: check.quota_exhausted,
      };
    }

    const rawToken    = await Usuario.createResetToken(usuario.id, 'email');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl    = `${frontendUrl}/reset-password?token=${rawToken}`;

    await Usuario.registerResend(usuario.id, 'reset_email');
    await emailService.sendResetPassword({ to: usuario.email, nombre: usuario.nombre, resetUrl });

    return {
      message: MSG_OK,
      retry_after_seconds: check.retry_after,
      ...(process.env.NODE_ENV === 'development' && { _debug_url: resetUrl }),
    };
  }

  // ═══════════════════════════════════════════
  // FORGOT PASSWORD — POR CELULAR
  // ═══════════════════════════════════════════

  async forgotByPhone(phone) {
    const MSG_OK   = 'Si el numero esta registrado, recibiras un codigo de verificacion.';
    const FALLBACK = Usuario.RESEND_COOLDOWNS.phone_otp.progressive[0];

    const usuario = await Usuario.findByPhone(phone);

    if (!usuario || !usuario.activo) {
      return { message: MSG_OK, retry_after_seconds: FALLBACK };
    }

    const check = Usuario.checkResendCooldown(usuario, 'phone_otp');
    if (!check.allowed) {
      return {
        message: check.quota_exhausted
          ? 'Demasiados intentos. Intenta de nuevo mas tarde.'
          : MSG_OK,
        retry_after_seconds: check.retry_after,
        quota_exhausted: check.quota_exhausted,
      };
    }

    const otp = await Usuario.createPhoneOtp(usuario.id);
    await Usuario.registerResend(usuario.id, 'phone_otp');
    await smsService.sendOtp({ to: usuario.telefono, code: otp });

    return {
      message: MSG_OK,
      retry_after_seconds: check.retry_after,
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
    const email_verified = usuario.email_verified !== false;
    return {
      usuario: {
        id: usuario.id, nombre: usuario.nombre, email: usuario.email,
        rol: usuario.rol, onboarding_completed, email_verified,
      },
      token,
      ...(!email_verified && { requires_verification: true }),
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
    const full = await Usuario.findById(id);
    const email_verified = full?.email_verified !== false;
    return { ...usuario, onboarding_completed, email_verified };
  }
}

module.exports = new AuthService();
