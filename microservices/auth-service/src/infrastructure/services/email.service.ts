import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { createLogger } from '../../../../shared/libs/logger';

@Injectable()
export class EmailService {
  private readonly logger = createLogger({ serviceName: 'auth-service' });
  private transporter: nodemailer.Transporter;

  constructor() {
    // Настройка SMTP для Yandex
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.yandex.ru',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'ioning@yandex.ru',
        pass: process.env.SMTP_PASSWORD || '',
      },
    });
  }

  async sendVerificationCode(email: string, code: string, fullName?: string): Promise<void> {
    const subject = 'Код подтверждения email - Care Monitoring';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .code { font-size: 32px; font-weight: bold; text-align: center; padding: 20px; 
                  background-color: white; border: 2px dashed #4CAF50; margin: 20px 0;
                  letter-spacing: 10px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Care Monitoring System</h1>
          </div>
          <div class="content">
            <p>${fullName ? `Здравствуйте, ${fullName}!` : 'Здравствуйте!'}</p>
            <p>Для завершения регистрации в системе Care Monitoring, пожалуйста, введите следующий код подтверждения:</p>
            <div class="code">${code}</div>
            <p>Код действителен в течение 15 минут.</p>
            <p>Если вы не регистрировались в нашей системе, просто проигнорируйте это письмо.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Care Monitoring System. Все права защищены.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Care Monitoring System

${fullName ? `Здравствуйте, ${fullName}!` : 'Здравствуйте!'}

Для завершения регистрации в системе Care Monitoring, пожалуйста, введите следующий код подтверждения:

${code}

Код действителен в течение 15 минут.

Если вы не регистрировались в нашей системе, просто проигнорируйте это письмо.

© ${new Date().getFullYear()} Care Monitoring System. Все права защищены.
    `;

    try {
      await this.transporter.sendMail({
        from: `"Care Monitoring" <${process.env.SMTP_USER || 'ioning@yandex.ru'}>`,
        to: email,
        subject,
        html,
        text,
      });

      this.logger.info('Verification email sent successfully', { email });
    } catch (error: any) {
      this.logger.error('Failed to send verification email', {
        error: error.message,
        email,
      });
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }
}

