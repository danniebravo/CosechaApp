/**
 * Servicio de envio de SMS usando Twilio.
 * - Con credenciales Twilio: envia SMS reales
 * - Sin credenciales: imprime en consola (modo desarrollo)
 *
 * En produccion, si el envio falla, lanza error para que el usuario lo sepa.
 */

class SmsService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.from = process.env.TWILIO_PHONE_NUMBER;
    this.client = null;
    this.isProduction = process.env.NODE_ENV === 'production';

    if (this.accountSid && this.authToken && this.from) {
      const twilio = require('twilio');
      this.client = twilio(this.accountSid, this.authToken);
      console.log('📱 SmsService: Twilio configurado');
    } else {
      console.log('📱 SmsService: Sin credenciales Twilio — modo consola (los SMS se imprimen en terminal)');
    }
  }

  /** Estado del servicio para health check */
  get isConfigured() {
    return !!this.client;
  }

  /**
   * Envia un SMS generico.
   * En produccion: lanza error si falla el envio.
   * En desarrollo sin credenciales: imprime en consola.
   */
  async send({ to, body }) {
    if (!this.client) {
      if (this.isProduction) {
        console.error('📱 Twilio no configurado en produccion');
        const err = new Error('Servicio de SMS no configurado. Contacta al administrador.');
        err.status = 503;
        throw err;
      }

      console.log('══════════════════════════════════════════');
      console.log('📱 SMS (consola)');
      console.log('Para:', to);
      console.log('Mensaje:', body);
      console.log('══════════════════════════════════════════');
      return { success: true, sid: 'console-stub' };
    }

    try {
      const message = await this.client.messages.create({
        body,
        from: this.from,
        to,
      });

      console.log('📱 SMS enviado:', message.sid);
      return { success: true, sid: message.sid };
    } catch (err) {
      console.error('📱 Error enviando SMS:', err.message);
      if (this.isProduction) {
        const error = new Error('No se pudo enviar el SMS. Verifica tu numero e intenta de nuevo.');
        error.status = 502;
        throw error;
      }
      return { success: false, error: err.message };
    }
  }

  /**
   * Envia codigo OTP por SMS.
   */
  async sendOtp({ to, code }) {
    return this.send({
      to,
      body: `CosechaApp: Tu codigo de verificacion es ${code}. Expira en 10 minutos. No compartas este codigo.`,
    });
  }
}

module.exports = new SmsService();
