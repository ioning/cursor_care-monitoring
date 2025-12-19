import { Injectable } from '@nestjs/common';
import { createLogger } from '../../../../../shared/libs/logger';
import { SendGridService } from './email/sendgrid.service';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class EmailService {
  private readonly logger = createLogger({ serviceName: 'integration-service' });
  private readonly provider: SendGridService;

  constructor() {
    this.provider = new SendGridService();
  }

  async send(message: EmailMessage): Promise<void> {
    try {
      await this.provider.send(message);
    } catch (error: any) {
      this.logger.error('Failed to send email', {
        error: error.message,
        to: message.to,
      });
      throw error;
    }
  }
}

