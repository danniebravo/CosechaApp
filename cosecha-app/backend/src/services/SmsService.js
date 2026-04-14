/**
 * Servicio de envio de SMS usando Twilio.
 * Si las credenciales no estan configuradas, imprime en consola (modo desarrollo).
 *
 * Uso:
 *   const smsService = require('./SmsService');
 *   await smsService.sendOtp({ to: '+573001234567', code: '123456' });
 */

class SmsService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.from = process.env.TWILIO_PHONE_NUMBER;
    this.client = null;

    if (this.accountSid && this.authToken && this.from) {
      const twilio = require('twilio');
      this.client = twilio(this.accountSid, this.authToken);
      console.log('📱 SmsService: Twilio configurado');
    } else {
      console.log('📱 SmsService: Sin credenciales Twilio — modo consola (los SMS se imprimen en terminal)');
    }
  }

  /**
   * Envia un SMS generico.
   * @returns {{ success: boolean, sid?: string, error?: string }}
   */
  async send({ to, body }) {
    if (!this.client) {
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
      return { success: false, error: err.message };
    }
  }

  /**
   * Envia codigo OTP de recuperacion.
   */
  async sendOtp({ to, code }) {
    return this.send({
      to,
      body: `CosechaApp: Tu codigo de verificacion es ${code}. Expira en 10 minutos. No compartas este codigo.`,
    });
  }
}

module.exports = new SmsService();
