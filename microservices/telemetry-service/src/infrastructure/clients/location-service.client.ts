import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../../../../../shared/libs/logger';

@Injectable()
export class LocationServiceClient {
  private readonly logger = createLogger({ serviceName: 'telemetry-service' });
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.LOCATION_SERVICE_URL || 'http://localhost:3006';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Record location for ward
   * This calls the location-service endpoint: POST /locations/wards/:wardId
   */
  async recordLocation(wardId: string, location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    source: string;
    timestamp?: Date;
  }): Promise<void> {
    try {
      await this.client.post(`/locations/wards/${wardId}`, {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        source: location.source,
        timestamp: location.timestamp?.toISOString(),
      }, {
        headers: {
          'X-Internal-Service': 'telemetry-service',
        },
      });

      this.logger.debug(`Location recorded for ward ${wardId}`, {
        wardId,
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } catch (error: any) {
      // Log error but don't fail telemetry processing if location service is unavailable
      this.logger.warn('Failed to record location in location-service', {
        wardId,
        error: error.message,
        status: error.response?.status,
      });
    }
  }
}

