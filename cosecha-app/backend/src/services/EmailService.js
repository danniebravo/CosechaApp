/**
 * Servicio de envio de email usando Resend.
 * - Con RESEND_API_KEY: envia emails reales via Resend API
 * - Sin RESEND_API_KEY: imprime en consola (modo desarrollo)
 *
 * En produccion, si el envio falla, lanza error para que el usuario lo sepa.
 */

// Escapar HTML para prevenir XSS en templates de email
const escapeHtml = (str) =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

class EmailService {
  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
    this.from = process.env.RESEND_FROM_EMAIL || 'CosechaApp <onboarding@resend.dev>';
    this.client = null;
    this.isProduction = process.env.NODE_ENV === 'production';

    if (this.apiKey) {
      const { Resend } = require('resend');
      this.client = new Resend(this.apiKey);
      console.log('📧 EmailService: Resend configurado');
    } else {
      console.log('📧 EmailService: Sin API key — modo consola (los emails se imprimen en terminal)');
    }
  }

  /** Estado del servicio para health check */
  get isConfigured() {
    return !!this.client;
  }

  /**
   * Envia un email generico.
   * En produccion: lanza error si falla el envio.
   * En desarrollo sin API key: imprime en consola.
   */
  async send({ to, subject, html }) {
    if (!this.client) {
      if (this.isProduction) {
        console.error('📧 RESEND_API_KEY no configurada en produccion');
        const err = new Error('Servicio de email no configurado. Contacta al administrador.');
        err.status = 503;
        throw err;
      }

      console.log('══════════════════════════════════════════');
      console.log('📧 EMAIL (consola)');
      console.log('Para:', to);
      console.log('Asunto:', subject);
      console.log('Contenido:', html.substring(0, 300) + '...');
      console.log('══════════════════════════════════════════');
      return { success: true, id: 'console-stub' };
    }

    try {
      const result = await this.client.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });

      if (result.error) {
        console.error('📧 Error Resend:', result.error);
        if (this.isProduction) {
          const err = new Error('No se pudo enviar el correo. Intenta de nuevo.');
          err.status = 502;
          throw err;
        }
        return { success: false, error: result.error.message };
      }

      console.log('📧 Email enviado:', result.data?.id);
      return { success: true, id: result.data?.id };
    } catch (err) {
      if (err.status) throw err; // Re-throw errores ya formateados
      console.error('📧 Error enviando email:', err.message);
      if (this.isProduction) {
        const error = new Error('Error al enviar correo. Intenta de nuevo.');
        error.status = 502;
        throw error;
      }
      return { success: false, error: err.message };
    }
  }

  /**
   * Envia email de recuperacion de contrasena.
   */
  async sendResetPassword({ to, nombre, resetUrl }) {
    const subject = 'CosechaApp — Recupera tu contrasena';
    const safeNombre = escapeHtml(nombre);
    // resetUrl es generado internamente, pero escapamos por seguridad
    const safeUrl = encodeURI(resetUrl);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#faf6f1;font-family:'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e0ccad;">
    <div style="background:linear-gradient(135deg,#265f2a,#3d9641);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">CosechaApp</h1>
    </div>
    <div style="padding:32px 24px;">
      <p style="color:#583627;font-size:16px;margin:0 0 8px;">Hola <strong>${safeNombre}</strong>,</p>
      <p style="color:#7d4d2f;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Recibimos una solicitud para restablecer tu contrasena. Haz clic en el boton para crear una nueva:
      </p>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${safeUrl}"
           style="display:inline-block;background:#3d9641;color:#ffffff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">
          Restablecer contrasena
        </a>
      </div>
      <p style="color:#be8f57;font-size:12px;text-align:center;margin:0 0 16px;">
        Este enlace expira en 1 hora.
      </p>
      <hr style="border:none;border-top:1px solid #e0ccad;margin:24px 0;">
      <p style="color:#9a6337;font-size:12px;line-height:1.5;margin:0;">
        Si no solicitaste este cambio, puedes ignorar este correo. Tu contrasena no sera modificada.
      </p>
      <p style="color:#cdab7d;font-size:11px;margin:16px 0 0;word-break:break-all;">
        ${safeUrl}
      </p>
    </div>
  </div>
</body>
</html>`;

    return this.send({ to, subject, html });
  }

  /**
   * Envia email de verificacion de cuenta con codigo OTP.
   */
  async sendVerificationCode({ to, nombre, code }) {
    const subject = 'CosechaApp — Verifica tu correo';
    const safeNombre = escapeHtml(nombre);
    // code es generado internamente (6 digitos), pero escapamos por principio
    const safeCode = escapeHtml(code);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#faf6f1;font-family:'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e0ccad;">
    <div style="background:linear-gradient(135deg,#265f2a,#3d9641);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">CosechaApp</h1>
    </div>
    <div style="padding:32px 24px;">
      <p style="color:#583627;font-size:16px;margin:0 0 8px;">Hola <strong>${safeNombre}</strong>,</p>
      <p style="color:#7d4d2f;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Ingresa este codigo para verificar tu correo electronico:
      </p>
      <div style="text-align:center;margin:0 0 24px;">
        <div style="display:inline-block;background:#f0f9f0;border:2px solid #3d9641;border-radius:12px;padding:16px 40px;">
          <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#265f2a;">${safeCode}</span>
        </div>
      </div>
      <p style="color:#be8f57;font-size:12px;text-align:center;margin:0 0 16px;">
        Este codigo expira en 10 minutos.
      </p>
      <hr style="border:none;border-top:1px solid #e0ccad;margin:24px 0;">
      <p style="color:#9a6337;font-size:12px;line-height:1.5;margin:0;">
        Si no creaste una cuenta en CosechaApp, puedes ignorar este correo.
      </p>
    </div>
  </div>
</body>
</html>`;

    return this.send({ to, subject, html });
  }
}

module.exports = new EmailService();
