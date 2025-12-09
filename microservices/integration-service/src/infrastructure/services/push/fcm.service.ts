import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PushMessage } from '../push.service';
import { createLogger } from '../../../../../shared/libs/logger';
import { retryWithBackoff } from '../../../../../shared/libs/retry';
import { CircuitBreaker } from '../../../../../shared/libs/circuit-breaker';
import * as jwt from 'jsonwebtoken';

export interface FCMAccessToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface FCMMessage {
  message: {
    token: string;
    notification?: {
      title: string;
      body: string;
    };
    data?: Record<string, string>;
    android?: {
      priority: 'normal' | 'high';
      notification?: {
        sound?: string;
        channel_id?: string;
        priority?: 'default' | 'min' | 'low' | 'high' | 'max';
      };
    };
    apns?: {
      headers?: {
        'apns-priority': string;
      };
      payload?: {
        aps: {
          sound?: string;
          badge?: number;
          alert?: {
            title?: string;
            body?: string;
          };
        };
      };
    };
  };
}

@Injectable()
export class FCMService {
  private readonly logger = createLogger({ serviceName: 'integration-service' });
  private readonly client: AxiosInstance;
  private readonly projectId: string;
  private readonly serviceAccountKey: any;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private readonly rateLimit = 1000; // messages per second
  private requestCount = 0;
  private lastResetTime = Date.now();
  private readonly circuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker('fcm', {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000, // 1 minute
      resetTimeout: 300000, // 5 minutes
    });
    this.projectId = process.env.FCM_PROJECT_ID || '';
    
    // Load service account key from environment or file
    const serviceAccountPath = process.env.FCM_SERVICE_ACCOUNT_KEY;
    if (serviceAccountPath) {
      try {
        this.serviceAccountKey = require(serviceAccountPath);
      } catch (error) {
        this.logger.warn('Failed to load FCM service account key', { error });
      }
    }

    // Try to load from JSON string in env
    if (!this.serviceAccountKey && process.env.FCM_SERVICE_ACCOUNT_JSON) {
      try {
        this.serviceAccountKey = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON);
      } catch (error) {
        this.logger.warn('Failed to parse FCM service account JSON', { error });
      }
    }

    this.client = axios.create({
      baseURL: `https://fcm.googleapis.com/v1/projects/${this.projectId}`,
      timeout: 30000,
    });
  }

  async send(message: PushMessage): Promise<void> {
    try {
      // Rate limiting check
      this.checkRateLimit();

      if (!this.projectId || !this.serviceAccountKey) {
        this.logger.warn('FCM not configured, skipping push notification');
        if (process.env.NODE_ENV === 'development') {
          this.logger.info('Push notification would be sent', {
            token: message.token.substring(0, 20) + '...',
            title: message.title,
          });
          return;
        }
        throw new Error('FCM not configured');
      }

      // Get access token
      const accessToken = await this.getAccessToken();

      // Prepare FCM message
      const fcmMessage: FCMMessage = {
        message: {
          token: message.token,
          notification: {
            title: message.title,
            body: message.body,
          },
          data: this.convertDataToStrings(message.data || {}),
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channel_id: 'emergency_alerts',
              priority: 'high',
            },
          },
          apns: {
            headers: {
              'apns-priority': '10',
            },
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
                alert: {
                  title: message.title,
                  body: message.body,
                },
              },
            },
          },
        },
      };

      // Send message
      await this.circuitBreaker.execute(async () => {
        return await retryWithBackoff(
          async () => {
            return await this.client.post(
              '/messages:send',
              fcmMessage,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
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

      this.logger.info('Push notification sent successfully via FCM', {
        token: message.token.substring(0, 20) + '...',
        title: message.title,
      });
      this.requestCount++;
    } catch (error: any) {
      this.logger.error('Failed to send push notification via FCM', {
        error: error.message,
        token: message.token.substring(0, 20) + '...',
        response: error.response?.data,
      });
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // Create JWT for service account
      const now = Math.floor(Date.now() / 1000);
      const jwtPayload = {
        iss: this.serviceAccountKey.client_email,
        sub: this.serviceAccountKey.client_email,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600, // 1 hour
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
      };

      const jwtToken = jwt.sign(jwtPayload, this.serviceAccountKey.private_key, {
        algorithm: 'RS256',
      });

      // Exchange JWT for access token
      const response = await axios.post<FCMAccessToken>(
        'https://oauth2.googleapis.com/token',
        {
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwtToken,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000; // 5 min buffer

      return this.accessToken;
    } catch (error: any) {
      this.logger.error('Failed to get FCM access token', { error: error.message });
      throw new Error(`Failed to get FCM access token: ${error.message}`);
    }
  }

  private convertDataToStrings(data: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return result;
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
        `FCM rate limit exceeded. Please wait ${Math.ceil(waitTime)}ms`,
      );
    }
  }
}




import { PushMessage } from '../push.service';
import { createLogger } from '../../../../../shared/libs/logger';
import { retryWithBackoff } from '../../../../../shared/libs/retry';
import { CircuitBreaker } from '../../../../../shared/libs/circuit-breaker';
import * as jwt from 'jsonwebtoken';

export interface FCMAccessToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface FCMMessage {
  message: {
    token: string;
    notification?: {
      title: string;
      body: string;
    };
    data?: Record<string, string>;
    android?: {
      priority: 'normal' | 'high';
      notification?: {
        sound?: string;
        channel_id?: string;
        priority?: 'default' | 'min' | 'low' | 'high' | 'max';
      };
    };
    apns?: {
      headers?: {
        'apns-priority': string;
      };
      payload?: {
        aps: {
          sound?: string;
          badge?: number;
          alert?: {
            title?: string;
            body?: string;
          };
        };
      };
    };
  };
}

@Injectable()
export class FCMService {
  private readonly logger = createLogger({ serviceName: 'integration-service' });
  private readonly client: AxiosInstance;
  private readonly projectId: string;
  private readonly serviceAccountKey: any;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private readonly rateLimit = 1000; // messages per second
  private requestCount = 0;
  private lastResetTime = Date.now();
  private readonly circuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker('fcm', {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000, // 1 minute
      resetTimeout: 300000, // 5 minutes
    });
    this.projectId = process.env.FCM_PROJECT_ID || '';
    
    // Load service account key from environment or file
    const serviceAccountPath = process.env.FCM_SERVICE_ACCOUNT_KEY;
    if (serviceAccountPath) {
      try {
        this.serviceAccountKey = require(serviceAccountPath);
      } catch (error) {
        this.logger.warn('Failed to load FCM service account key', { error });
      }
    }

    // Try to load from JSON string in env
    if (!this.serviceAccountKey && process.env.FCM_SERVICE_ACCOUNT_JSON) {
      try {
        this.serviceAccountKey = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON);
      } catch (error) {
        this.logger.warn('Failed to parse FCM service account JSON', { error });
      }
    }

    this.client = axios.create({
      baseURL: `https://fcm.googleapis.com/v1/projects/${this.projectId}`,
      timeout: 30000,
    });
  }

  async send(message: PushMessage): Promise<void> {
    try {
      // Rate limiting check
      this.checkRateLimit();

      if (!this.projectId || !this.serviceAccountKey) {
        this.logger.warn('FCM not configured, skipping push notification');
        if (process.env.NODE_ENV === 'development') {
          this.logger.info('Push notification would be sent', {
            token: message.token.substring(0, 20) + '...',
            title: message.title,
          });
          return;
        }
        throw new Error('FCM not configured');
      }

      // Get access token
      const accessToken = await this.getAccessToken();

      // Prepare FCM message
      const fcmMessage: FCMMessage = {
        message: {
          token: message.token,
          notification: {
            title: message.title,
            body: message.body,
          },
          data: this.convertDataToStrings(message.data || {}),
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channel_id: 'emergency_alerts',
              priority: 'high',
            },
          },
          apns: {
            headers: {
              'apns-priority': '10',
            },
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
                alert: {
                  title: message.title,
                  body: message.body,
                },
              },
            },
          },
        },
      };

      // Send message
      await this.circuitBreaker.execute(async () => {
        return await retryWithBackoff(
          async () => {
            return await this.client.post(
              '/messages:send',
              fcmMessage,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
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

      this.logger.info('Push notification sent successfully via FCM', {
        token: message.token.substring(0, 20) + '...',
        title: message.title,
      });
      this.requestCount++;
    } catch (error: any) {
      this.logger.error('Failed to send push notification via FCM', {
        error: error.message,
        token: message.token.substring(0, 20) + '...',
        response: error.response?.data,
      });
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // Create JWT for service account
      const now = Math.floor(Date.now() / 1000);
      const jwtPayload = {
        iss: this.serviceAccountKey.client_email,
        sub: this.serviceAccountKey.client_email,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600, // 1 hour
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
      };

      const jwtToken = jwt.sign(jwtPayload, this.serviceAccountKey.private_key, {
        algorithm: 'RS256',
      });

      // Exchange JWT for access token
      const response = await axios.post<FCMAccessToken>(
        'https://oauth2.googleapis.com/token',
        {
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwtToken,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000; // 5 min buffer

      return this.accessToken;
    } catch (error: any) {
      this.logger.error('Failed to get FCM access token', { error: error.message });
      throw new Error(`Failed to get FCM access token: ${error.message}`);
    }
  }

  private convertDataToStrings(data: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return result;
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
        `FCM rate limit exceeded. Please wait ${Math.ceil(waitTime)}ms`,
      );
    }
  }
}

