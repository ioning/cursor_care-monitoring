import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../../../../../shared/libs/logger';

@Injectable()
export class AlertServiceClient {
  private readonly logger = createLogger({ serviceName: 'analytics-service' });
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.ALERT_SERVICE_URL || 'http://localhost:3005';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service': 'analytics-service',
      },
    });
  }

  /**
   * Get alerts for a user/ward
   */
  async getAlerts(userId: string, filters: { wardId?: string; status?: string; severity?: string }, token?: string): Promise<any[]> {
    try {
      const headers: any = {
        'X-Internal-Service': 'analytics-service',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await this.client.get(`/alerts`, {
        params: { ...filters, page: 1, limit: 1000 },
        headers,
      });
      return response.data?.data || [];
    } catch (error: any) {
      this.logger.warn('Failed to fetch alerts', {
        userId,
        error: error.message,
        status: error.response?.status,
      });
      return [];
    }
  }
}

