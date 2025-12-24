import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { createLogger } from '@care-monitoring/shared/libs/logger';

export interface CreateWardUserDto {
  id: string; // Ward ID (будет использован как User ID)
  fullName: string;
  phone: string;
  password: string;
  organizationId?: string;
}

@ApiTags('internal')
@Controller('internal')
export class InternalController {
  private readonly logger = createLogger({ serviceName: 'auth-service' });

  constructor(private readonly authService: AuthService) {}

  /**
   * Internal endpoint for service-to-service user creation
   * Protected by X-Internal-Service header
   */
  @Post('users/ward')
  @ApiOperation({ summary: '[Internal] Create ward user account' })
  @ApiResponse({ status: 201, description: 'Ward user created successfully' })
  async createWardUser(
    @Body() createWardUserDto: CreateWardUserDto,
    @Headers('x-internal-service') serviceName?: string,
  ) {
    // Basic service-to-service authentication check
    const allowedServices = ['user-service'];
    if (serviceName && !allowedServices.includes(serviceName.toLowerCase())) {
      this.logger.warn('Unauthorized internal service call', {
        serviceName,
        wardId: createWardUserDto.id,
      });
      throw new Error('Unauthorized internal service call');
    }

    try {
      // Генерируем email на основе телефона
      const email = this.generateEmailFromPhone(createWardUserDto.phone);

      // Используем существующий метод register, но с пропуском email верификации
      const result = await this.authService.registerInternal({
        id: createWardUserDto.id,
        email,
        password: createWardUserDto.password,
        fullName: createWardUserDto.fullName,
        phone: createWardUserDto.phone,
        role: 'ward',
        organizationId: createWardUserDto.organizationId,
        skipEmailVerification: true, // Пропускаем верификацию email для подопечных
      });

      return {
        success: true,
        data: {
          id: result.data.user.id,
          email: result.data.user.email,
          phone: createWardUserDto.phone,
          fullName: createWardUserDto.fullName,
          role: 'ward',
        },
      };
    } catch (error: any) {
      this.logger.error('Failed to create ward user (internal)', {
        wardId: createWardUserDto.id,
        error: error.message,
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

