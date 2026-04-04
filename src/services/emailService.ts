import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        pool: true,
        maxConnections: 5,
        connectionTimeout: 10000,
      });
    }
    return this.transporter;
  }
  /**
   * Envía un código de verificación de 6 dígitos al correo del usuario.
   */
  static async sendVerificationCode(email: string, code: string) {
    const mailOptions = {
      from: `"NutriCasa" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verifica tu cuenta de NutriCasa',
      html: `
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
      `,
    };

    try {
      console.log(`📧 Intentando enviar código de verificación a: ${email}...`);
      const transporter = this.getTransporter();
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email de verificación enviado a ${email}`);
    } catch (error) {
      console.error('Error al enviar email de verificación:', error);
      throw new Error('No se pudo enviar el correo de verificación');
    }
  }

  /**
   * Envía un enlace para restablecer la contraseña.
   */
  static async sendResetPasswordLink(email: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"NutriCasa" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Restablecer tu contraseña de NutriCasa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
          <h2 style="color: #16a34a; text-align: center;">Restablecer Contraseña</h2>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para continuar:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #16a34a; font-size: 12px;">${resetUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">Este enlace expirará en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="text-align: center; color: #999; font-size: 12px;">© 2024 NutriCasa - Tu salud es nuestra prioridad</p>
        </div>
      `,
    };

    try {
      console.log(`📧 Intentando enviar enlace de recuperación a: ${email}...`);
      const transporter = this.getTransporter();
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email de recuperación enviado a ${email}`);
    } catch (error) {
      console.error('Error al enviar email de recuperación:', error);
      throw new Error('No se pudo enviar el correo de recuperación');
    }
  }

  /**
   * Envía un código 2FA para el inicio de sesión.
   */
  static async send2FACode(email: string, code: string) {
    const mailOptions = {
      from: `"NutriCasa Seguridad" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Tu código de seguridad de NutriCasa (MFA)',
      html: `
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
      `,
    };

    try {
      console.log(`📧 Enviando código 2FA a: ${email}...`);
      const transporter = this.getTransporter();
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email 2FA enviado a ${email}`);
    } catch (error) {
      console.error('Error al enviar email 2FA:', error);
      // No lanzamos error para no bloquear el login, el usuario recibirá el error de "código no enviado" al intentar verificar
    }
  }
}
