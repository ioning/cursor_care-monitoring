import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../../../../../shared/libs/logger';

@Injectable()
export class TelemetryServiceClient {
  private readonly logger = createLogger({ serviceName: 'device-service' });
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.TELEMETRY_SERVICE_URL || 'http://localhost:3004';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service': 'device-service',
      },
    });
  }

  /**
   * Send telemetry metrics to telemetry service
   */
  async sendTelemetry(data: {
    deviceId: string;
    metrics: Array<{
      type: string;
      value: number;
      unit?: string;
      qualityScore?: number;
      timestamp?: string;
    }>;
  }): Promise<any> {
    try {
      const response = await this.client.post('/telemetry', data, {
        headers: {
          'X-Internal-Service': 'device-service',
        },
      });
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to send telemetry to telemetry-service', {
        deviceId: data.deviceId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }
}

