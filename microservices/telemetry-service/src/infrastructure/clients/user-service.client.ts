import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../../../../../shared/libs/logger';

@Injectable()
export class UserServiceClient {
  private readonly logger = createLogger({ serviceName: 'telemetry-service' });
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
  async hasAccessToWard(userId: string, wardId: string, userRole?: string): Promise<boolean> {
    // Admin users have access to all wards
    if (userRole === 'admin') {
      return true;
    }

    // Ward users can only access their own data
    if (userRole === 'ward' && userId !== wardId) {
      return false;
    }

    // Dispatcher users have access to all wards
    if (userRole === 'dispatcher') {
      return true;
    }

    // Guardian users need to check access through guardian_wards table
    try {
      const response = await this.client.get(`/internal/wards/${wardId}/access/${userId}`, {
        headers: {
          'X-Internal-Service': 'telemetry-service',
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

