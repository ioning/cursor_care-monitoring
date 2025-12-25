import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../../../../../shared/libs/logger';

@Injectable()
export class UserServiceClient {
  private readonly logger = createLogger({ serviceName: 'analytics-service' });
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';

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
   * Get system statistics
   */
  async getSystemStats(token?: string): Promise<{ totalUsers: number; totalWards: number } | null> {
    try {
      const headers: any = {
        'X-Internal-Service': 'analytics-service',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Try to get stats from internal endpoint if available
      try {
        const response = await this.client.get(`/internal/stats`, { headers });
        if (response.data?.success && response.data.data) {
          return response.data.data;
        }
      } catch (internalError) {
        // Internal endpoint might not exist, continue with fallback
        this.logger.debug('Internal stats endpoint not available, using fallback');
      }

      return null;
    } catch (error: any) {
      this.logger.warn('Failed to fetch system stats from user-service', {
        error: error.message,
        status: error.response?.status,
      });
      return null;
    }
  }
}

