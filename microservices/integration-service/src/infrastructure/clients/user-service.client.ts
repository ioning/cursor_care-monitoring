import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../../../../../shared/libs/logger';

export interface GuardianData {
  id: string;
  guardianId: string;
  email: string;
  phone?: string;
  pushToken?: string;
  telegramChatId?: string;
  preferences?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    telegram?: boolean;
  };
}

@Injectable()
export class UserServiceClient {
  private readonly logger = createLogger({ serviceName: 'integration-service' });
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

    // Add service-to-service authentication if needed
    // For internal calls, we can use a service token or skip auth
    // this.client.interceptors.request.use((config) => {
    //   config.headers['X-Service-Token'] = process.env.INTERNAL_SERVICE_TOKEN;
    //   return config;
    // });
  }

  /**
   * Get all guardians for a ward
   * This calls the user-service internal endpoint: GET /internal/wards/:wardId/guardians
   */
  async getGuardiansForWard(wardId: string): Promise<GuardianData[]> {
    try {
      const response = await this.client.get(`/internal/wards/${wardId}/guardians`, {
        headers: {
          'X-Internal-Service': 'integration-service',
        },
      });

      if (response.data?.success && Array.isArray(response.data.data)) {
        // Map the response from user-service to the format expected by integration-service
        return response.data.data.map((guardian: any) => ({
          id: guardian.guardianId,
          guardianId: guardian.guardianId,
          email: guardian.guardianEmail || guardian.email,
          phone: guardian.guardianPhone || guardian.phone,
          pushToken: guardian.pushToken,
          telegramChatId: guardian.telegramChatId,
          preferences: guardian.notificationPreferences || {
            email: true,
            sms: true,
            push: true,
            telegram: false,
          },
        }));
      }

      this.logger.warn('Unexpected response format from user-service', {
        wardId,
        response: response.data,
      });
      return [];
    } catch (error: any) {
      this.logger.error('Failed to fetch guardians from user-service', {
        wardId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      // Return empty array on error - the service will continue without notifications
      // In production, you might want to retry or use a fallback
      return [];
    }
  }

  /**
   * Get ward push token from notification devices
   * This is a simplified approach - tries to get token from notification_devices table
   * If table doesn't exist, returns null (push will be skipped)
   */
  async getWardPushToken(wardId: string): Promise<string | null> {
    try {
      // Try to query notification_devices table if it exists
      // The table should be created by integration-service when devices register
      const { getDatabaseConnection } = require('../../../../../shared/libs/database');
      const db = getDatabaseConnection();
      
      // Check if table exists first
      const tableCheck = await db.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'notification_devices'
        )`
      );

      if (!tableCheck.rows[0]?.exists) {
        this.logger.warn('notification_devices table does not exist', { wardId });
        return null;
      }
      
      const result = await db.query(
        `SELECT token FROM notification_devices 
         WHERE user_id = $1 AND platform IN ('ios', 'android') 
         ORDER BY updated_at DESC LIMIT 1`,
        [wardId]
      );

      if (result.rows.length > 0) {
        return result.rows[0].token;
      }

      return null;
    } catch (error: any) {
      // If table doesn't exist or query fails, just log and return null
      // This is not critical - polling will handle incoming calls
      this.logger.warn('Failed to fetch ward push token (non-critical)', {
        wardId,
        error: error.message,
      });
      return null;
    }
  }
}

