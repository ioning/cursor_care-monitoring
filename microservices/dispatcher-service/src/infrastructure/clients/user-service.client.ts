import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../../../../../shared/libs/logger';

@Injectable()
export class UserServiceClient {
  private readonly logger = createLogger({ serviceName: 'dispatcher-service' });
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get ward information by ward ID
   * This calls the user-service internal endpoint: GET /internal/wards/:wardId
   */
  async getWardById(wardId: string): Promise<any | null> {
    try {
      const response = await this.client.get(`/internal/wards/${wardId}`, {
        headers: {
          'X-Internal-Service': 'dispatcher-service',
        },
      });

      if (response.data?.success && response.data.data) {
        return response.data.data;
      }

      this.logger.warn('Unexpected response format from user-service', {
        wardId,
        response: response.data,
      });
      return null;
    } catch (error: any) {
      this.logger.error('Failed to get ward from user-service', {
        wardId,
        error: error.message,
        status: error.response?.status,
      });
      return null;
    }
  }

  /**
   * Get multiple wards by their IDs
   */
  async getWardsByIds(wardIds: string[]): Promise<Map<string, any>> {
    const wardsMap = new Map<string, any>();
    
    // Fetch wards in parallel
    const promises = wardIds.map(async (wardId) => {
      const ward = await this.getWardById(wardId);
      if (ward) {
        wardsMap.set(wardId, ward);
      }
    });

    await Promise.all(promises);
    return wardsMap;
  }
}

