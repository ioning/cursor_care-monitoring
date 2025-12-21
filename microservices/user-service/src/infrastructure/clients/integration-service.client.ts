import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../../../../../shared/libs/logger';

export interface SendSmsRequest {
  to: string;
  message: string;
}

@Injectable()
export class IntegrationServiceClient {
  private readonly logger = createLogger({ serviceName: 'user-service' });
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.INTEGRATION_SERVICE_URL || 'http://localhost:3008';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Send SMS message
   * Calls internal endpoint in integration-service
   */
  async sendSms(data: SendSmsRequest): Promise<void> {
    try {
      const response = await this.client.post('/internal/sms/send', data, {
        headers: {
          'X-Internal-Service': 'user-service',
        },
      });

      if (response.data?.success) {
        this.logger.info('SMS sent successfully', { to: data.to });
        return;
      }

      throw new Error('Failed to send SMS: unexpected response format');
    } catch (error: any) {
      // Если внутренний endpoint не найден (404), пробуем через публичный endpoint
      if (error.response?.status === 404) {
        this.logger.warn('Internal SMS endpoint not found, trying alternative method');
        // В development режиме просто логируем
        if (process.env.NODE_ENV === 'development') {
          this.logger.info('SMS would be sent (dev mode)', {
            to: data.to,
            message: data.message.substring(0, 50) + '...',
          });
          return;
        }
      }

      this.logger.error('Failed to send SMS via integration-service', {
        to: data.to,
        error: error.message,
        status: error.response?.status,
      });
      // Не бросаем ошибку, чтобы не блокировать создание подопечного
      // Логируем и продолжаем
    }
  }
}

