import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { SmsMessage } from '../sms.service';
import { createLogger } from '../../../../../shared/libs/logger';
import { retryWithBackoff } from '../../../../../shared/libs/retry';
import { CircuitBreaker } from '../../../../../shared/libs/circuit-breaker';

export interface SMSRuResponse {
  status: string;
  status_code: number;
  sms?: {
    [phone: string]: {
      status: string;
      status_code: number;
      sms_id?: string;
      status_text?: string;
    };
  };
  balance?: number;
}

@Injectable()
export class SMSRuService {
  private readonly logger = createLogger({ serviceName: 'integration-service' });
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly apiUrl = 'https://sms.ru/sms/send';
  private readonly rateLimit = 100; // SMS per minute
  private requestCount = 0;
  private lastResetTime = Date.now();
  private readonly circuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker('smsru', {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000, // 1 minute
      resetTimeout: 300000, // 5 minutes
    });
    this.apiKey = process.env.SMSRU_API_KEY || '';

    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async send(message: SmsMessage): Promise<void> {
    try {
      // Rate limiting check
      this.checkRateLimit();

      if (!this.apiKey) {
        this.logger.warn('SMS.ru API key not configured, skipping SMS send');
        if (process.env.NODE_ENV === 'development') {
          this.logger.info('SMS would be sent', {
            to: message.to,
            message: message.message.substring(0, 50) + '...',
          });
          return;
        }
        throw new Error('SMS.ru API key not configured');
      }

      const params = new URLSearchParams({
        api_id: this.apiKey,
        to: message.to,
        msg: message.message,
        json: '1',
      });

      const response = await this.circuitBreaker.execute(async () => {
        return await retryWithBackoff(
          async () => {
            return await this.client.post<SMSRuResponse>('', params.toString());
          },
          {
            maxAttempts: 3,
            initialDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 2,
          },
          this.logger,
        );
      });

      if (response.data.status === 'OK' && response.data.status_code === 100) {
        const smsInfo = response.data.sms?.[message.to];
        if (smsInfo?.status === 'OK') {
          this.logger.info('SMS sent successfully via SMS.ru', {
            to: message.to,
            smsId: smsInfo.sms_id,
          });
          this.requestCount++;
        } else {
          throw new Error(
            `SMS.ru error: ${smsInfo?.status_text || 'Unknown error'}`,
          );
        }
      } else {
        throw new Error(
          `SMS.ru API error: ${response.data.status_code} - ${response.data.status}`,
        );
      }
    } catch (error: any) {
      this.logger.error('Failed to send SMS via SMS.ru', {
        error: error.message,
        to: message.to,
        response: error.response?.data,
      });
      throw error;
    }
  }

  private checkRateLimit(): void {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    // Reset counter if a minute has passed
    if (now - this.lastResetTime >= oneMinute) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    if (this.requestCount >= this.rateLimit) {
      const waitTime = oneMinute - (now - this.lastResetTime);
      throw new Error(
        `SMS rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds`,
      );
    }
  }

  async getBalance(): Promise<number> {
    try {
      if (!this.apiKey) {
        return 0;
      }

      const response = await axios.get('https://sms.ru/my/balance', {
        params: {
          api_id: this.apiKey,
          json: '1',
        },
      });

      return response.data.balance || 0;
    } catch (error: any) {
      this.logger.error('Failed to get SMS.ru balance', { error: error.message });
      return 0;
    }
  }
}




import { SmsMessage } from '../sms.service';
import { createLogger } from '../../../../../shared/libs/logger';
import { retryWithBackoff } from '../../../../../shared/libs/retry';
import { CircuitBreaker } from '../../../../../shared/libs/circuit-breaker';

export interface SMSRuResponse {
  status: string;
  status_code: number;
  sms?: {
    [phone: string]: {
      status: string;
      status_code: number;
      sms_id?: string;
      status_text?: string;
    };
  };
  balance?: number;
}

@Injectable()
export class SMSRuService {
  private readonly logger = createLogger({ serviceName: 'integration-service' });
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly apiUrl = 'https://sms.ru/sms/send';
  private readonly rateLimit = 100; // SMS per minute
  private requestCount = 0;
  private lastResetTime = Date.now();
  private readonly circuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker('smsru', {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000, // 1 minute
      resetTimeout: 300000, // 5 minutes
    });
    this.apiKey = process.env.SMSRU_API_KEY || '';

    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  async send(message: SmsMessage): Promise<void> {
    try {
      // Rate limiting check
      this.checkRateLimit();

      if (!this.apiKey) {
        this.logger.warn('SMS.ru API key not configured, skipping SMS send');
        if (process.env.NODE_ENV === 'development') {
          this.logger.info('SMS would be sent', {
            to: message.to,
            message: message.message.substring(0, 50) + '...',
          });
          return;
        }
        throw new Error('SMS.ru API key not configured');
      }

      const params = new URLSearchParams({
        api_id: this.apiKey,
        to: message.to,
        msg: message.message,
        json: '1',
      });

      const response = await this.circuitBreaker.execute(async () => {
        return await retryWithBackoff(
          async () => {
            return await this.client.post<SMSRuResponse>('', params.toString());
          },
          {
            maxAttempts: 3,
            initialDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 2,
          },
          this.logger,
        );
      });

      if (response.data.status === 'OK' && response.data.status_code === 100) {
        const smsInfo = response.data.sms?.[message.to];
        if (smsInfo?.status === 'OK') {
          this.logger.info('SMS sent successfully via SMS.ru', {
            to: message.to,
            smsId: smsInfo.sms_id,
          });
          this.requestCount++;
        } else {
          throw new Error(
            `SMS.ru error: ${smsInfo?.status_text || 'Unknown error'}`,
          );
        }
      } else {
        throw new Error(
          `SMS.ru API error: ${response.data.status_code} - ${response.data.status}`,
        );
      }
    } catch (error: any) {
      this.logger.error('Failed to send SMS via SMS.ru', {
        error: error.message,
        to: message.to,
        response: error.response?.data,
      });
      throw error;
    }
  }

  private checkRateLimit(): void {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    // Reset counter if a minute has passed
    if (now - this.lastResetTime >= oneMinute) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    if (this.requestCount >= this.rateLimit) {
      const waitTime = oneMinute - (now - this.lastResetTime);
      throw new Error(
        `SMS rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds`,
      );
    }
  }

  async getBalance(): Promise<number> {
    try {
      if (!this.apiKey) {
        return 0;
      }

      const response = await axios.get('https://sms.ru/my/balance', {
        params: {
          api_id: this.apiKey,
          json: '1',
        },
      });

      return response.data.balance || 0;
    } catch (error: any) {
      this.logger.error('Failed to get SMS.ru balance', { error: error.message });
      return 0;
    }
  }
}

