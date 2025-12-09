import { Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/libs/logger';
import { SMSRuService } from './sms/smsru.service';

export interface SmsMessage {
  to: string;
  message: string;
}

@Injectable()
export class SmsService {
  private readonly logger = createLogger({ serviceName: 'integration-service' });
  private readonly provider: SMSRuService;

  constructor() {
    this.provider = new SMSRuService();
  }

  async send(message: SmsMessage): Promise<void> {
    try {
      await this.provider.send(message);
    } catch (error: any) {
      this.logger.error('Failed to send SMS', { error: error.message, to: message.to });
      throw error;
    }
  }
}

