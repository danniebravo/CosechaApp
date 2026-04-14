/**
 * Servicio de envio de email usando Resend.
 * Si RESEND_API_KEY no esta configurada, imprime en consola (modo desarrollo).
 *
 * Uso:
 *   const emailService = require('./EmailService');
 *   await emailService.sendResetPassword({ to, nombre, resetUrl });
 */

class EmailService {
  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
    this.from = process.env.RESEND_FROM_EMAIL || 'CosechaApp <onboarding@resend.dev>';
    this.client = null;

    if (this.apiKey) {
      const { Resend } = require('resend');
      this.client = new Resend(this.apiKey);
      console.log('📧 EmailService: Resend configurado');
    } else {
      console.log('📧 EmailService: Sin API key — modo consola (los emails se imprimen en terminal)');
    }
  }

  /**
   * Envia un email generico.
   * @returns {{ success: boolean, id?: string, error?: string }}
   */
  async send({ to, subject, html }) {
    if (!this.client) {
      console.log('══════════════════════════════════════════');
      console.log('📧 EMAIL (consola)');
      console.log('Para:', to);
      console.log('Asunto:', subject);
      console.log('Contenido:', html.substring(0, 200) + '...');
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
        return { success: false, error: result.error.message };
      }

      console.log('📧 Email enviado:', result.data?.id);
      return { success: true, id: result.data?.id };
    } catch (err) {
      console.error('📧 Error enviando email:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Envia email de recuperacion de contrasena.
   */
  async sendResetPassword({ to, nombre, resetUrl }) {
    const subject = 'CosechaApp — Recupera tu contrasena';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#faf6f1;font-family:'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e0ccad;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#265f2a,#3d9641);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">🌱 CosechaApp</h1>
    </div>
    <!-- Body -->
    <div style="padding:32px 24px;">
      <p style="color:#583627;font-size:16px;margin:0 0 8px;">Hola <strong>${nombre}</strong>,</p>
      <p style="color:#7d4d2f;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Recibimos una solicitud para restablecer tu contrasena. Haz clic en el boton para crear una nueva:
      </p>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${resetUrl}"
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
        ${resetUrl}
      </p>
    </div>
  </div>
</body>
</html>`;

    return this.send({ to, subject, html });
  }
}

module.exports = new EmailService();
