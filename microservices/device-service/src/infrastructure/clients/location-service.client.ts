import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../../../../../shared/libs/logger';

@Injectable()
export class LocationServiceClient {
  private readonly logger = createLogger({ serviceName: 'device-service' });
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.LOCATION_SERVICE_URL || 'http://localhost:3006';

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
   * Send location data to location service
   */
  async sendLocation(wardId: string, locationData: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    source: string;
    timestamp?: string;
  }): Promise<any> {
    try {
      const response = await this.client.post(`/locations/wards/${wardId}`, locationData, {
        headers: {
          'X-Internal-Service': 'device-service',
        },
      });
      return response.data;
    } catch (error: any) {
      this.logger.error('Failed to send location to location-service', {
        wardId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }
}

