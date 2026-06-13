import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('MAIL_HOST', 'smtp.ethereal.email'),
      port: this.config.get<number>('MAIL_PORT', 587),
      secure: false,
      auth: {
        user: this.config.get('MAIL_USER', ''),
        pass: this.config.get('MAIL_PASS', ''),
      },
    });
  }

  async sendPatientAccessEmail(to: string, name: string, code: string) {
    const appUrl = this.config.get('APP_URL', 'http://localhost:5173');
    const loginUrl = `${appUrl}/paciente/login`;

    await this.transporter.sendMail({
      from: `"Cognilab" <${this.config.get('MAIL_FROM', 'noreply@cognilab.app')}>`,
      to,
      subject: 'Tu código de acceso a Cognilab',
      html: `
        <h2>Hola, ${name}</h2>
        <p>Tu profesional te ha asignado acceso a la plataforma Cognilab.</p>
        <p>Tu código de acceso es:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:6px;padding:16px 24px;background:#f3f4f6;border-radius:8px;display:inline-block;margin:8px 0;">
          ${code}
        </div>
        <p>Accede en: <a href="${loginUrl}">${loginUrl}</a></p>
        <p>Guarda este código en un lugar seguro.</p>
      `,
    }).catch((err: unknown) => {
      this.logger.warn(`Error enviando código de acceso a ${to}: ${String(err)}`);
    });
  }

  async sendVerificationEmail(to: string, name: string, token: string) {
    const appUrl = this.config.get('APP_URL', 'http://localhost:5173');
    const verifyUrl = `${appUrl}/verificar-email?token=${token}`;

    await this.transporter.sendMail({
      from: `"Cognilab" <${this.config.get('MAIL_FROM', 'noreply@cognilab.app')}>`,
      to,
      subject: 'Verifica tu cuenta en Cognilab',
      html: `
        <h2>Hola, ${name}</h2>
        <p>Gracias por registrarte en Cognilab. Por favor, verifica tu correo haciendo clic en el enlace:</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:white;text-decoration:none;border-radius:6px;">
          Verificar correo
        </a>
        <p>El enlace expira en 24 horas.</p>
        <p>Si no has creado una cuenta, ignora este correo.</p>
      `,
    }).catch((err: unknown) => {
      this.logger.warn(`Error enviando email de verificación a ${to}: ${String(err)}`);
    });
  }
}
