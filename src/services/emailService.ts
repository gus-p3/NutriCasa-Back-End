import nodemailer from 'nodemailer'; // Keeping import for types or later use if needed, though we will use fetch

export class EmailService {
  private static readonly API_URL = 'https://api.brevo.com/v3/smtp/email';
  private static readonly API_KEY = process.env.EMAIL_PASS || '';
  private static readonly SENDER_EMAIL = process.env.EMAIL_USER || 'nutricasa875@gmail.com';
  private static readonly SENDER_NAME = 'NutriCasa';

  /**
   * Helper to send emails via Brevo API
   */
  private static async sendEmail(to: string, subject: string, html: string, senderName?: string) {
    try {
      console.log(`📧 Enviando email a: ${to} con asunto: "${subject}"...`);
      
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: senderName || this.SENDER_NAME,
            email: this.SENDER_EMAIL,
          },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error de Brevo API:', response.status, errorData);
        throw new Error(`Error al enviar email: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Email enviado con éxito. ID: ${data.messageId}`);
      return data;
    } catch (error) {
      console.error('❌ Error en EmailService:', error);
      throw error;
    }
  }

  /**
   * Envía un código de verificación de 6 dígitos al correo del usuario.
   */
  static async sendVerificationCode(email: string, code: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
        <h2 style="color: #16a34a; text-align: center;">¡Bienvenido a NutriCasa!</h2>
        <p>Gracias por unirte a nosotros. Para completar tu registro, por favor usa el siguiente código de verificación:</p>
        <div style="background-color: #f0fdf4; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #15803d;">${code}</span>
        </div>
        <p style="color: #666; font-size: 14px;">Este código expirará en 15 minutos. Si no solicitaste esta cuenta, puedes ignorar este correo.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: center; color: #999; font-size: 12px;">© 2024 NutriCasa - Tu salud es nuestra prioridad</p>
      </div>
    `;

    try {
      await this.sendEmail(email, 'Verifica tu cuenta de NutriCasa', html);
    } catch (error) {
      throw new Error('No se pudo enviar el correo de verificación');
    }
  }

  /**
   * Envía un código de 6 dígitos para restablecer la contraseña.
   */
  static async sendResetPasswordCode(email: string, code: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
        <h2 style="color: #16a34a; text-align: center;">Restablecer Contraseña</h2>
        <p>Has solicitado restablecer tu contraseña en NutriCasa. Usa el siguiente código para continuar:</p>
        <div style="background-color: #f0fdf4; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #15803d;">${code}</span>
        </div>
        <p style="color: #666; font-size: 14px;">Este código expirará en <strong>15 minutos</strong>. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: center; color: #999; font-size: 12px;">© 2024 NutriCasa - Tu salud es nuestra prioridad</p>
      </div>
    `;

    try {
      await this.sendEmail(email, 'Código para restablecer tu contraseña de NutriCasa', html);
    } catch (error) {
      throw new Error('No se pudo enviar el correo de recuperación');
    }
  }

  /**
   * Envía un código 2FA para el inicio de sesión.
   */
  static async send2FACode(email: string, code: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
        <h2 style="color: #16a34a; text-align: center;">Verificación de Seguridad</h2>
        <p>Se ha detectado un intento de inicio de sesión en tu cuenta. Usa este código para confirmar que eres tú:</p>
        <div style="background-color: #f0fdf4; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #15803d;">${code}</span>
        </div>
        <p style="color: #666; font-size: 14px;">Este código expirará en 10 minutos. Si no has sido tú, te recomendamos cambiar tu contraseña de inmediato.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: center; color: #999; font-size: 12px;">© 2024 NutriCasa - Protegiendo tu salud y tus datos</p>
      </div>
    `;

    try {
      await this.sendEmail(email, 'Tu código de seguridad de NutriCasa (MFA)', html, 'NutriCasa Seguridad');
    } catch (error) {
      // No lanzamos error para no bloquear el login
      console.error('Error al enviar email 2FA:', error);
    }
  }
}

