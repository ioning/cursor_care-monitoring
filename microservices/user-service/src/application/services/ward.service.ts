import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { WardRepository } from '../../infrastructure/repositories/ward.repository';
import { GuardianWardRepository } from '../../infrastructure/repositories/guardian-ward.repository';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { CreateWardDto } from '../../infrastructure/dto/create-ward.dto';
import { UpdateWardDto } from '../../infrastructure/dto/update-ward.dto';
import { LinkWardDto } from '../../infrastructure/dto/link-ward.dto';
import { AuthServiceClient } from '../../infrastructure/clients/auth-service.client';
import { IntegrationServiceClient } from '../../infrastructure/clients/integration-service.client';
import { createLogger } from '../../../../../shared/libs/logger';
import { randomUUID, randomBytes } from 'crypto';

@Injectable()
export class WardService {
  private readonly logger = createLogger({ serviceName: 'user-service' });

  constructor(
    private readonly wardRepository: WardRepository,
    private readonly guardianWardRepository: GuardianWardRepository,
    private readonly userRepository: UserRepository,
    private readonly authServiceClient: AuthServiceClient,
    private readonly integrationServiceClient: IntegrationServiceClient,
  ) {}

  async getWardsByGuardianId(guardianId: string) {
    const wards = await this.guardianWardRepository.findWardsByGuardianId(guardianId);
    return {
      success: true,
      data: wards,
    };
  }

  async create(guardianId: string, createWardDto: CreateWardDto) {
    const wardId = randomUUID();
    
    // Получаем информацию об опекуне для organizationId
    const guardian = await this.userRepository.findById(guardianId);
    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    // Создаем запись в wards (исключаем phone и relationship, так как они не в схеме таблицы wards)
    const { phone, relationship, ...wardData } = createWardDto;
    const ward = await this.wardRepository.create({
      id: wardId,
      ...wardData,
      organizationId: guardian.organizationId,
    });

    // Link ward to guardian
    await this.guardianWardRepository.create({
      guardianId,
      wardId,
      relationship: createWardDto.relationship || 'ward',
    });

    // Телефон обязателен, создаем аккаунт и отправляем SMS
    let accountCreated = false;
    let temporaryPassword: string | null = null;

    try {
      // Генерируем временный пароль
      temporaryPassword = this.generateTemporaryPassword();

      // Создаем пользователя в Auth Service
      await this.authServiceClient.createWardUser({
        id: wardId, // Используем тот же UUID что и для ward
        fullName: createWardDto.fullName,
        phone: createWardDto.phone,
        password: temporaryPassword,
        organizationId: guardian.organizationId,
      });

      accountCreated = true;

      // Отправляем SMS с учетными данными
      const smsMessage = this.createSmsMessage(createWardDto.fullName, temporaryPassword);
      await this.integrationServiceClient.sendSms({
        to: createWardDto.phone,
        message: smsMessage,
      });

      this.logger.info(`Ward account created and SMS sent: ${wardId}`, {
        wardId,
        guardianId,
        phone: createWardDto.phone,
      });
    } catch (error: any) {
      this.logger.error('Failed to create ward account or send SMS', {
        wardId,
        guardianId,
        error: error.message,
        status: error.response?.status,
      });
      // Прерываем создание подопечного, так как телефон обязателен
      // Используем правильный HTTP Exception для корректной обработки на фронтенде
      if (error.response?.status === 400 || error.response?.status === 409) {
        throw new BadRequestException(`Не удалось создать аккаунт подопечного: ${error.response?.data?.message || error.message}`);
      }
      throw new InternalServerErrorException(`Не удалось создать аккаунт подопечного: ${error.message}`);
    }

    this.logger.info(`Ward created: ${wardId} by guardian ${guardianId}`, {
      wardId,
      guardianId,
      accountCreated,
    });

    return {
      success: true,
      data: ward,
      message: 'Ward created successfully',
      accountCreated,
      temporaryPassword, // Всегда возвращаем пароль для отображения опекуну
    };
  }

  /**
   * Generate temporary password for ward
   */
  private generateTemporaryPassword(): string {
    // Генерируем пароль: 8 символов (буквы + цифры)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const passwordLength = 8;
    let password = '';

    // Гарантируем хотя бы одну цифру и одну букву
    password += chars[Math.floor(Math.random() * 10) + 52]; // Цифра
    password += chars[Math.floor(Math.random() * 26)]; // Заглавная буква
    password += chars[Math.floor(Math.random() * 26) + 26]; // Строчная буква

    // Заполняем остальные символы
    for (let i = password.length; i < passwordLength; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }

    // Перемешиваем символы
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * Create SMS message with credentials
   */
  private createSmsMessage(wardName: string, password: string): string {
    return `Care Monitoring: Для ${wardName} создан аккаунт. Пароль: ${password}. Скачайте приложение: https://care-monitoring.ru/app`;
  }

  async getById(guardianId: string, wardId: string) {
    // Verify guardian has access to this ward
    const hasAccess = await this.guardianWardRepository.hasAccess(guardianId, wardId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this ward');
    }

    const ward = await this.wardRepository.findById(wardId);
    if (!ward) {
      throw new NotFoundException('Ward not found');
    }

    return {
      success: true,
      data: ward,
    };
  }

  /**
   * Internal method to get ward by ID without access check
   * Used for service-to-service calls (dispatcher, alert-service, etc.)
   */
  async getByIdInternal(wardId: string) {
    const ward = await this.wardRepository.findById(wardId);
    return ward;
  }

  async update(guardianId: string, wardId: string, updateWardDto: UpdateWardDto) {
    // Verify guardian has access
    const hasAccess = await this.guardianWardRepository.hasAccess(guardianId, wardId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this ward');
    }

    const ward = await this.wardRepository.update(wardId, {
      ...updateWardDto,
      dateOfBirth: updateWardDto.dateOfBirth ? new Date(updateWardDto.dateOfBirth) : undefined,
    });

    this.logger.info(`Ward updated: ${wardId} by guardian ${guardianId}`, { wardId, guardianId });

    return {
      success: true,
      data: ward,
      message: 'Ward updated successfully',
    };
  }

  async delete(guardianId: string, wardId: string) {
    // Verify guardian has access
    const hasAccess = await this.guardianWardRepository.hasAccess(guardianId, wardId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this ward');
    }

    await this.wardRepository.delete(wardId);
    await this.guardianWardRepository.deleteByWardId(wardId);

    this.logger.info(`Ward deleted: ${wardId} by guardian ${guardianId}`, { wardId, guardianId });

    return {
      success: true,
      message: 'Ward deleted successfully',
    };
  }

  async linkWard(guardianId: string, linkWardDto: LinkWardDto) {
    // Verify ward exists
    const ward = await this.wardRepository.findById(linkWardDto.wardId);
    if (!ward) {
      throw new NotFoundException('Ward not found');
    }

    // Check if already linked
    const existing = await this.guardianWardRepository.findByGuardianAndWard(
      guardianId,
      linkWardDto.wardId,
    );
    if (existing) {
      throw new ForbiddenException('Ward is already linked to this guardian');
    }

    await this.guardianWardRepository.create({
      guardianId,
      wardId: linkWardDto.wardId,
      relationship: linkWardDto.relationship || 'ward',
    });

    this.logger.info(`Ward linked: ${linkWardDto.wardId} to guardian ${guardianId}`, {
      wardId: linkWardDto.wardId,
      guardianId,
    });

    return {
      success: true,
      message: 'Ward linked successfully',
    };
  }

  async updateAvatar(guardianId: string, wardId: string, avatarUrl: string) {
    // Verify guardian has access
    const hasAccess = await this.guardianWardRepository.hasAccess(guardianId, wardId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this ward');
    }

    const ward = await this.wardRepository.update(wardId, { avatarUrl });

    this.logger.info(`Ward avatar updated: ${wardId} by guardian ${guardianId}`, {
      wardId,
      guardianId,
    });

    return {
      success: true,
      data: ward,
      message: 'Avatar updated successfully',
    };
  }
}


