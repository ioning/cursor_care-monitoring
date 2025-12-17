import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { EmailMessage } from '../email.service';
import { createLogger } from '../../../../../shared/libs/logger';
import { retryWithBackoff } from '../../../../../shared/libs/retry';
import { CircuitBreaker } from '../../../../../shared/libs/circuit-breaker';

export interface SendGridMessage {
  personalizations: Array<{
    to: Array<{ email: string }>;
    subject: string;
  }>;
  from: { email: string; name?: string };
  content: Array<{
    type: string;
    value: string;
  }>;
  tracking_settings?: {
    click_tracking?: { enable: boolean };
    open_tracking?: { enable: boolean };
  };
}

@Injectable()
export class SendGridService {
  private readonly logger = createLogger({ serviceName: 'integration-service' });
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly apiUrl = 'https://api.sendgrid.com/v3/mail/send';
  private readonly rateLimit = 100; // emails per second
  private requestCount = 0;
  private lastResetTime = Date.now();
  private readonly circuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker('sendgrid', {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000, // 1 minute
      resetTimeout: 300000, // 5 minutes
    });
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@care-monitoring.ru';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Care Monitoring';

    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async send(message: EmailMessage): Promise<void> {
    try {
      // Rate limiting check
      this.checkRateLimit();

      if (!this.apiKey) {
        this.logger.warn('SendGrid API key not configured, skipping email send');
        if (process.env.NODE_ENV === 'development') {
          this.logger.info('Email would be sent', {
            to: message.to,
            subject: message.subject,
          });
          return;
        }
        throw new Error('SendGrid API key not configured');
      }

      const sendGridMessage: SendGridMessage = {
        personalizations: [
          {
            to: [{ email: message.to }],
            subject: message.subject,
          },
        ],
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        content: [
          {
            type: 'text/plain',
            value: message.text,
          },
          {
            type: 'text/html',
            value: message.html,
          },
        ],
        tracking_settings: {
          click_tracking: { enable: true },
          open_tracking: { enable: true },
        },
      };

      await this.circuitBreaker.execute(async () => {
        return await retryWithBackoff(
          async () => {
            return await this.client.post('', sendGridMessage);
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

      this.logger.info('Email sent successfully via SendGrid', {
        to: message.to,
        subject: message.subject,
      });
      this.requestCount++;
    } catch (error: any) {
      this.logger.error('Failed to send email via SendGrid', {
        error: error.message,
        to: message.to,
        response: error.response?.data,
      });
      throw error;
    }
  }

  private checkRateLimit(): void {
    const now = Date.now();
    const oneSecond = 1000;

    // Reset counter if a second has passed
    if (now - this.lastResetTime >= oneSecond) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    if (this.requestCount >= this.rateLimit) {
      const waitTime = oneSecond - (now - this.lastResetTime);
      throw new Error(
        `Email rate limit exceeded. Please wait ${Math.ceil(waitTime)}ms`,
      );
    }
  }
}

