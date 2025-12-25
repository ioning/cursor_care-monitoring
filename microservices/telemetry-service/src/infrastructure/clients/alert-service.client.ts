import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../../../../../shared/libs/logger';
import { randomUUID } from 'crypto';

@Injectable()
export class AlertServiceClient {
  private readonly logger = createLogger({ serviceName: 'telemetry-service' });
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.ALERT_SERVICE_URL || 'http://localhost:3005';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create immediate alert for critical metrics
   * This calls the alert-service internal endpoint
   */
  async createImmediateAlert(wardId: string, alertData: {
    alertType: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    dataSnapshot?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.client.post('/alerts/internal/create', {
        wardId,
        ...alertData,
      }, {
        headers: {
          'X-Internal-Service': 'telemetry-service',
        },
      });

      this.logger.info(`Immediate alert created for ward ${wardId}`, {
        wardId,
        alertType: alertData.alertType,
        severity: alertData.severity,
      });
    } catch (error: any) {
      // Log error but don't fail telemetry processing if alert service is unavailable
      this.logger.warn('Failed to create immediate alert in alert-service', {
        wardId,
        alertType: alertData.alertType,
        error: error.message,
        status: error.response?.status,
      });
    }
  }
}

