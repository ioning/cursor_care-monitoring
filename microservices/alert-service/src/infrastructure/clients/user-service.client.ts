import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../../../../../shared/libs/logger';

@Injectable()
export class UserServiceClient {
  private readonly logger = createLogger({ serviceName: 'alert-service' });
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
   * Check if user has access to ward
   * This calls the user-service internal endpoint: GET /internal/wards/:wardId/access/:userId
   */
  async hasAccessToWard(userId: string, wardId: string): Promise<boolean> {
    try {
      const response = await this.client.get(`/internal/wards/${wardId}/access/${userId}`, {
        headers: {
          'X-Internal-Service': 'alert-service',
        },
      });

      if (response.data?.success && response.data.data?.hasAccess !== undefined) {
        return response.data.data.hasAccess;
      }

      this.logger.warn('Unexpected response format from user-service', {
        userId,
        wardId,
        response: response.data,
      });
      return false;
    } catch (error: any) {
      this.logger.error('Failed to check access from user-service', {
        userId,
        wardId,
        error: error.message,
        status: error.response?.status,
      });

      // On error, deny access for security
      return false;
    }
  }
}

