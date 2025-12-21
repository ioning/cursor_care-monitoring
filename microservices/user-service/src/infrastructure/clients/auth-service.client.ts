import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../../../../../shared/libs/logger';

export interface CreateWardUserRequest {
  id: string; // Ward ID (будет использован как User ID)
  fullName: string;
  phone: string;
  password: string;
  organizationId?: string;
}

export interface CreateWardUserResponse {
  success: boolean;
  data: {
    id: string;
    email?: string;
    phone: string;
    fullName: string;
    role: string;
  };
}

@Injectable()
export class AuthServiceClient {
  private readonly logger = createLogger({ serviceName: 'user-service' });
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create ward user account
   * Calls internal endpoint in auth-service
   */
  async createWardUser(data: CreateWardUserRequest): Promise<CreateWardUserResponse> {
    try {
      // Используем внутренний endpoint или обычный register
      // Если нет внутреннего endpoint, используем register с service token
      const response = await this.client.post('/internal/users/ward', data, {
        headers: {
          'X-Internal-Service': 'user-service',
        },
      });

      if (response.data?.success) {
        return response.data;
      }

      // Fallback: если внутренний endpoint не существует, используем register
      return await this.createWardUserViaRegister(data);
    } catch (error: any) {
      // Если внутренний endpoint не найден (404), пробуем через register
      if (error.response?.status === 404) {
        this.logger.warn('Internal endpoint not found, using register endpoint', { wardId: data.id });
        return await this.createWardUserViaRegister(data);
      }

      this.logger.error('Failed to create ward user in auth-service', {
        wardId: data.id,
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Fallback: Create ward user via register endpoint
   */
  private async createWardUserViaRegister(data: CreateWardUserRequest): Promise<CreateWardUserResponse> {
    try {
      // Генерируем email на основе телефона, если нет email
      const email = this.generateEmailFromPhone(data.phone);
      
      const response = await this.client.post('/auth/register', {
        email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        role: 'ward',
        organizationId: data.organizationId,
      });

      return {
        success: true,
        data: {
          id: response.data.data?.user?.id || data.id,
          email: email,
          phone: data.phone,
          fullName: data.fullName,
          role: 'ward',
        },
      };
    } catch (error: any) {
      this.logger.error('Failed to create ward user via register', {
        wardId: data.id,
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Generate email from phone number
   */
  private generateEmailFromPhone(phone: string): string {
    // Убираем все нецифровые символы
    const digits = phone.replace(/\D/g, '');
    // Генерируем email вида: ward+79001234567@care-monitoring.ru
    return `ward+${digits}@care-monitoring.ru`;
  }
}

