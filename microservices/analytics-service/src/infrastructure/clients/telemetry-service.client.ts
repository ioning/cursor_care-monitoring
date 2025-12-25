import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../../../../../shared/libs/logger';

@Injectable()
export class TelemetryServiceClient {
  private readonly logger = createLogger({ serviceName: 'analytics-service' });
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.TELEMETRY_SERVICE_URL || 'http://localhost:3004';

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
   * Get latest telemetry data for a ward
   */
  async getLatestTelemetry(wardId: string, token?: string): Promise<any> {
    try {
      const headers: any = {
        'X-Internal-Service': 'analytics-service',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await this.client.get(`/telemetry/wards/${wardId}/latest`, { headers });
      return response.data?.data || null;
    } catch (error: any) {
      this.logger.warn('Failed to fetch latest telemetry', {
        wardId,
        error: error.message,
        status: error.response?.status,
      });
      return null;
    }
  }

  /**
   * Get telemetry history for a ward
   */
  async getTelemetryHistory(
    wardId: string,
    from: string,
    to: string,
    limit: number = 100,
    token?: string,
  ): Promise<any[]> {
    try {
      const headers: any = {
        'X-Internal-Service': 'analytics-service',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await this.client.get(`/telemetry/wards/${wardId}`, {
        params: { from, to, limit },
        headers,
      });
      return response.data?.data || [];
    } catch (error: any) {
      this.logger.warn('Failed to fetch telemetry history', {
        wardId,
        error: error.message,
        status: error.response?.status,
      });
      return [];
    }
  }
}

