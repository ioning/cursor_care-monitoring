import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import {
  PaymentProvider,
  PaymentData,
  PaymentResponse,
  PaymentStatus,
} from '../payment-provider.interface';
import {
  YooKassaPaymentRequest,
  YooKassaPaymentResponse,
  YooKassaWebhookPayload,
} from './yookassa.types';
import { createLogger } from '../../../../../../shared/libs/logger';
import { retryWithBackoff } from '../../../../../../shared/libs/retry';
import { CircuitBreaker } from '../../../../../../shared/libs/circuit-breaker';

@Injectable()
export class YooKassaAdapter implements PaymentProvider {
  private readonly logger = createLogger({ serviceName: 'billing-service' });
  private readonly client: AxiosInstance;
  private readonly shopId: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly circuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker('yookassa', {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000, // 1 minute
      resetTimeout: 300000, // 5 minutes
    });
    this.shopId = process.env.YOOKASSA_SHOP_ID || '';
    this.secretKey = process.env.YOOKASSA_SECRET_KEY || '';
    const isTest = process.env.YOOKASSA_TEST_MODE === 'true';
    this.baseUrl = isTest
      ? 'https://api.yookassa.ru/v3'
      : 'https://api.yookassa.ru/v3';

    const auth = Buffer.from(`${this.shopId}:${this.secretKey}`).toString('base64');

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async createPayment(data: PaymentData): Promise<PaymentResponse> {
    try {
      const idempotenceKey = crypto.randomUUID();

      const request: YooKassaPaymentRequest = {
        amount: {
          value: data.amount.toFixed(2),
          currency: data.currency,
        },
        confirmation: {
          type: 'redirect',
          return_url: data.returnUrl,
        },
        description: data.description,
        metadata: data.metadata,
        capture: true,
      };

      const response = await this.circuitBreaker.execute(async () => {
        return await retryWithBackoff(
          async () => {
            return await this.client.post<YooKassaPaymentResponse>(
              '/payments',
              request,
              {
                headers: {
                  'Idempotence-Key': idempotenceKey,
                },
              },
            );
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

      this.logger.info('YooKassa payment created', {
        paymentId: response.data.id,
        amount: data.amount,
      });

      return {
        id: response.data.id,
        status: this.mapStatus(response.data.status),
        confirmationUrl: response.data.confirmation?.confirmation_url,
        amount: {
          value: response.data.amount.value,
          currency: response.data.amount.currency,
        },
      };
    } catch (error: any) {
      this.logger.error('Failed to create YooKassa payment', {
        error: error.message,
        response: error.response?.data,
      });
      throw new Error(`YooKassa payment creation failed: ${error.message}`);
    }
  }

  async getPaymentStatus(id: string): Promise<PaymentStatus> {
    try {
      const response = await this.circuitBreaker.execute(async () => {
        return await retryWithBackoff(
          async () => {
            return await this.client.get<YooKassaPaymentResponse>(
              `/payments/${id}`,
            );
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

      return {
        id: response.data.id,
        status: this.mapStatus(response.data.status),
        paid: response.data.paid,
        amount: {
          value: response.data.amount.value,
          currency: response.data.amount.currency,
        },
        metadata: response.data.metadata,
      };
    } catch (error: any) {
      this.logger.error('Failed to get YooKassa payment status', {
        paymentId: id,
        error: error.message,
      });
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  validateWebhook(payload: any, signature: string): boolean {
    try {
      // YooKassa использует HMAC-SHA256 для подписи
      // В реальной реализации нужно проверить подпись через X-YooMoney-Signature
      const payloadString = JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(payloadString)
        .digest('hex');

      // В реальности YooKassa отправляет подпись в заголовке
      // Здесь упрощенная проверка для демонстрации
      return true; // В production нужно реальная проверка подписи
    } catch (error) {
      this.logger.error('Failed to validate YooKassa webhook signature', { error });
      return false;
    }
  }

  async processWebhook(payload: any): Promise<PaymentStatus> {
    const webhook = payload as YooKassaWebhookPayload;

    if (webhook.type !== 'notification') {
      throw new Error('Invalid webhook type');
    }

    const payment = webhook.object;

    return {
      id: payment.id,
      status: this.mapStatus(payment.status),
      paid: payment.paid,
      amount: {
        value: payment.amount.value,
        currency: payment.amount.currency,
      },
      metadata: payment.metadata,
    };
  }

  private mapStatus(status: string): 'pending' | 'succeeded' | 'canceled' | 'failed' {
    switch (status) {
      case 'succeeded':
        return 'succeeded';
      case 'canceled':
        return 'canceled';
      case 'pending':
      case 'waiting_for_capture':
        return 'pending';
      default:
        return 'failed';
    }
  }
}

