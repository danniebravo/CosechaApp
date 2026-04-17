const BaseModel = require('./BaseModel');
const { query } = require('../config/database');
const crypto = require('crypto');

// Constantes de seguridad
const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_DURATION_MINUTES = 15;
const RESET_TOKEN_EXPIRY_HOURS = 1;
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

// Cooldown / anti-abuso de reenvios
const RESEND_COOLDOWNS = {
  phone_otp:   { seconds: 30, maxPerWindow: 5, windowHours: 1 },
  reset_email: { seconds: 60, maxPerWindow: 5, windowHours: 1 },
};

class Usuario extends BaseModel {
  constructor() {
    super('usuarios');
  }

  async findByEmail(email) {
    const result = await query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  async findByPhone(phone) {
    const result = await query('SELECT * FROM usuarios WHERE telefono = $1', [phone]);
    return result.rows[0] || null;
  }

  async findByGoogleId(googleId) {
    const result = await query('SELECT * FROM usuarios WHERE google_id = $1', [googleId]);
    return result.rows[0] || null;
  }

  async findByIdSafe(id) {
    const result = await query(
      'SELECT id, nombre, email, telefono, rol, activo, auth_provider, created_at FROM usuarios WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async checkOnboarding(usuarioId) {
    const result = await query(
      `SELECT EXISTS (
        SELECT 1 FROM fincas f
        INNER JOIN lotes l ON l.finca_id = f.id AND l.activo = true
        WHERE f.usuario_id = $1 AND f.activa = true
      ) AS completed`,
      [usuarioId]
    );
    return result.rows[0].completed;
  }

  // ═══════════════════════════════════════════
  // BLOQUEO POR INTENTOS FALLIDOS
  // ═══════════════════════════════════════════

  isLocked(usuario) {
    if (!usuario.locked_until) return { locked: false, minutes_remaining: null };
    const now = new Date();
    const lockEnd = new Date(usuario.locked_until);
    if (now < lockEnd) {
      const remaining = Math.ceil((lockEnd - now) / 60000);
      return { locked: true, minutes_remaining: remaining };
    }
    return { locked: false, minutes_remaining: null };
  }

  async incrementFailedAttempts(id) {
    const r = await query(
      `UPDATE usuarios SET failed_login_attempts = COALESCE(failed_login_attempts,0) + 1
       WHERE id = $1 RETURNING failed_login_attempts`, [id]
    );
    const attempts = r.rows[0]?.failed_login_attempts || 0;
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
      await query('UPDATE usuarios SET locked_until = $1 WHERE id = $2', [lockUntil, id]);
    }
    return attempts;
  }

  async resetFailedAttempts(id) {
    await query(
      'UPDATE usuarios SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1', [id]
    );
  }

  // ═══════════════════════════════════════════
  // RESET TOKEN (email)
  // ═══════════════════════════════════════════

  async createResetToken(id, method = 'email') {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
    await query(
      `UPDATE usuarios SET reset_token_hash = $1, reset_token_expires_at = $2, reset_method = $3 WHERE id = $4`,
      [tokenHash, expiresAt, method, id]
    );
    return rawToken;
  }

  async findByResetToken(rawToken) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const result = await query(
      'SELECT * FROM usuarios WHERE reset_token_hash = $1 AND reset_token_expires_at > NOW()',
      [tokenHash]
    );
    return result.rows[0] || null;
  }

  async clearResetToken(id) {
    await query(
      `UPDATE usuarios SET reset_token_hash = NULL, reset_token_expires_at = NULL, reset_method = NULL WHERE id = $1`,
      [id]
    );
  }

  // ═══════════════════════════════════════════
  // OTP POR CELULAR
  // ═══════════════════════════════════════════

  /**
   * Genera OTP de 6 digitos, guarda su hash en DB.
   * @returns {string} codigo OTP raw (para enviar por SMS)
   */
  async createPhoneOtp(id) {
    const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6 digitos
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await query(
      `UPDATE usuarios
       SET phone_otp_hash = $1, phone_otp_expires_at = $2, phone_otp_attempts = 0
       WHERE id = $3`,
      [otpHash, expiresAt, id]
    );
    return otp;
  }

  /**
   * Verifica un OTP ingresado.
   * @returns {{ valid: boolean, expired: boolean, maxAttempts: boolean }}
   */
  async verifyPhoneOtp(id, otpInput) {
    const user = await this.findById(id);
    if (!user || !user.phone_otp_hash) {
      return { valid: false, expired: true, maxAttempts: false };
    }

    // Expirado?
    if (new Date() > new Date(user.phone_otp_expires_at)) {
      await this.clearPhoneOtp(id);
      return { valid: false, expired: true, maxAttempts: false };
    }

    // Max intentos?
    if (user.phone_otp_attempts >= OTP_MAX_ATTEMPTS) {
      await this.clearPhoneOtp(id);
      return { valid: false, expired: false, maxAttempts: true };
    }

    const inputHash = crypto.createHash('sha256').update(String(otpInput)).digest('hex');
    if (inputHash === user.phone_otp_hash) {
      return { valid: true, expired: false, maxAttempts: false };
    }

    // Incrementar intentos fallidos de OTP
    await query(
      'UPDATE usuarios SET phone_otp_attempts = phone_otp_attempts + 1 WHERE id = $1', [id]
    );
    return { valid: false, expired: false, maxAttempts: false };
  }

  async clearPhoneOtp(id) {
    await query(
      'UPDATE usuarios SET phone_otp_hash = NULL, phone_otp_expires_at = NULL, phone_otp_attempts = 0 WHERE id = $1',
      [id]
    );
  }

  // ═══════════════════════════════════════════
  // COOLDOWN DE REENVIO (OTP / EMAIL)
  // ═══════════════════════════════════════════

  /**
   * Verifica si el usuario puede reenviar (cooldown + cuota por ventana).
   * NO modifica el estado.
   *
   * @param {object} usuario  fila de la tabla usuarios
   * @param {'phone_otp'|'reset_email'} channel
   * @returns {{ allowed: boolean, retry_after: number }}
   *   retry_after = segundos hasta el proximo envio permitido
   */
  checkResendCooldown(usuario, channel) {
    const cfg = RESEND_COOLDOWNS[channel];
    if (!cfg) throw new Error(`Canal de reenvio desconocido: ${channel}`);

    const lastSent  = usuario[`${channel}_last_sent_at`];
    const winStart  = usuario[`${channel}_window_started_at`];
    const sendCount = usuario[`${channel}_send_count`] || 0;

    const now    = Date.now();
    const winMs  = cfg.windowHours * 3600 * 1000;
    const winExpired = !winStart || (now - new Date(winStart).getTime()) >= winMs;

    // 1) Cooldown corto entre envios
    if (lastSent) {
      const elapsedSec = (now - new Date(lastSent).getTime()) / 1000;
      if (elapsedSec < cfg.seconds) {
        return { allowed: false, retry_after: Math.ceil(cfg.seconds - elapsedSec) };
      }
    }

    // 2) Cuota por ventana de 1h
    if (!winExpired && sendCount >= cfg.maxPerWindow) {
      const elapsedSec = (now - new Date(winStart).getTime()) / 1000;
      const waitSec = Math.ceil(cfg.windowHours * 3600 - elapsedSec);
      return { allowed: false, retry_after: Math.max(waitSec, cfg.seconds) };
    }

    return { allowed: true, retry_after: cfg.seconds };
  }

  /**
   * Registra que se realizo un envio (actualiza last_sent_at, send_count y window).
   * Reinicia la ventana si expiro.
   */
  async registerResend(id, channel) {
    const cfg = RESEND_COOLDOWNS[channel];
    if (!cfg) throw new Error(`Canal de reenvio desconocido: ${channel}`);

    const now   = new Date();
    const winMs = cfg.windowHours * 3600 * 1000;

    const r = await query(
      `SELECT ${channel}_window_started_at AS win_start
         FROM usuarios WHERE id = $1`,
      [id]
    );
    const winStart = r.rows[0]?.win_start;
    const winExpired = !winStart || (now - new Date(winStart)) >= winMs;

    if (winExpired) {
      await query(
        `UPDATE usuarios
            SET ${channel}_last_sent_at      = $1,
                ${channel}_window_started_at = $1,
                ${channel}_send_count        = 1
          WHERE id = $2`,
        [now, id]
      );
    } else {
      await query(
        `UPDATE usuarios
            SET ${channel}_last_sent_at = $1,
                ${channel}_send_count   = ${channel}_send_count + 1
          WHERE id = $2`,
        [now, id]
      );
    }
  }

  // ═══════════════════════════════════════════
  // ACTUALIZAR PASSWORD
  // ═══════════════════════════════════════════

  async updatePassword(id, passwordHash) {
    await query(
      `UPDATE usuarios
       SET password_hash = $1,
           reset_token_hash = NULL, reset_token_expires_at = NULL, reset_method = NULL,
           phone_otp_hash = NULL, phone_otp_expires_at = NULL, phone_otp_attempts = 0,
           failed_login_attempts = 0, locked_until = NULL
       WHERE id = $2`,
      [passwordHash, id]
    );
  }
}

// Las estáticas de clase NO se heredan por la instancia exportada.
// Las exponemos en el módulo y también en la instancia para uso directo
// (p. ej. desde AuthService: `Usuario.MAX_LOGIN_ATTEMPTS`).
const usuario = new Usuario();
usuario.MAX_LOGIN_ATTEMPTS    = MAX_LOGIN_ATTEMPTS;
usuario.LOCK_DURATION_MINUTES = LOCK_DURATION_MINUTES;
usuario.OTP_EXPIRY_MINUTES    = OTP_EXPIRY_MINUTES;
usuario.RESEND_COOLDOWNS      = RESEND_COOLDOWNS;

module.exports = usuario;
