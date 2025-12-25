import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../../../../../shared/libs/logger';

@Injectable()
export class AlertServiceClient {
  private readonly logger = createLogger({ serviceName: 'ai-prediction-service' });
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.ALERT_SERVICE_URL || 'http://localhost:3005';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service': 'ai-prediction-service',
      },
    });
  }

  /**
   * Get recent alerts for a ward
   */
  async getRecentAlerts(
    wardId: string,
    options?: {
      severity?: string;
      status?: string;
      limit?: number;
      hours?: number;
    },
  ): Promise<any[]> {
    try {
      const hours = options?.hours || 24;
      const from = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const params: any = {
        wardId,
        page: 1,
        limit: options?.limit || 100,
      };

      if (options?.severity) {
        params.severity = options.severity;
      }
      if (options?.status) {
        params.status = options.status;
      }

      // Note: Alert service might not support date filtering directly
      // This would need to be implemented in alert-service or filtered client-side
      const response = await this.client.get(`/alerts`, {
        params,
        headers: {
          'X-Internal-Service': 'ai-prediction-service',
        },
      });

      const alerts = response.data?.data || [];
      
      // Filter by time if needed (client-side fallback)
      if (alerts.length > 0 && alerts[0].createdAt) {
        const fromTime = new Date(from).getTime();
        return alerts.filter((alert: any) => {
          const alertTime = new Date(alert.createdAt || alert.triggeredAt).getTime();
          return alertTime >= fromTime;
        });
      }

      return alerts;
    } catch (error: any) {
      this.logger.warn('Failed to fetch alerts from alert-service', {
        wardId,
        error: error.message,
        status: error.response?.status,
      });
      return [];
    }
  }

  /**
   * Get alert by ID
   */
  async getAlertById(alertId: string): Promise<any | null> {
    try {
      const response = await this.client.get(`/alerts/id/${alertId}`, {
        headers: {
          'X-Internal-Service': 'ai-prediction-service',
        },
      });
      return response.data?.data || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      this.logger.warn('Failed to fetch alert by ID', {
        alertId,
        error: error.message,
      });
      return null;
    }
  }
}

