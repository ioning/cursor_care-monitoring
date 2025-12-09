import { Injectable } from '@nestjs/common';
import { createLogger } from '../../../../shared/libs/logger';
import { FCMService } from './push/fcm.service';

export interface PushMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class PushService {
  private readonly logger = createLogger({ serviceName: 'integration-service' });
  private readonly provider: FCMService;

  constructor() {
    this.provider = new FCMService();
  }

  async send(message: PushMessage): Promise<void> {
    try {
      await this.provider.send(message);
    } catch (error: any) {
      this.logger.error('Failed to send push notification', {
        error: error.message,
        token: message.token.substring(0, 20) + '...',
      });
      throw error;
    }
  }
}

