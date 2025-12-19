import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../../../../../shared/libs/logger';

@Injectable()
export class DeviceServiceClient {
  private readonly logger = createLogger({ serviceName: 'telemetry-service' });
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.DEVICE_SERVICE_URL || 'http://localhost:3003';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get ward ID for a device
   * This calls the device-service internal endpoint: GET /internal/devices/:deviceId/ward
   */
  async getWardIdByDeviceId(deviceId: string): Promise<string | null> {
    try {
      const response = await this.client.get(`/internal/devices/${deviceId}/ward`, {
        headers: {
          'X-Internal-Service': 'telemetry-service',
        },
      });

      if (response.data?.success && response.data.data?.wardId) {
        return response.data.data.wardId;
      }

      this.logger.warn('Device not linked to ward', { deviceId });
      return null;
    } catch (error: any) {
      // If device not found or not linked, return null instead of throwing
      if (error.response?.status === 404 || error.response?.status === 400) {
        this.logger.warn('Device not found or not linked to ward', {
          deviceId,
          status: error.response?.status,
        });
        return null;
      }

      this.logger.error('Failed to fetch ward ID from device-service', {
        deviceId,
        error: error.message,
        status: error.response?.status,
      });

      // Return null on error - telemetry will be stored without wardId
      return null;
    }
  }
}

