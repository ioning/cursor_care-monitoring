import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GuardianWardRepository } from '../../infrastructure/repositories/guardian-ward.repository';
import { FamilyChatRepository, CreateFamilyChatMessageDto } from '../../infrastructure/repositories/family-chat.repository';
import { createLogger } from '../../../../../shared/libs/logger';

export interface AddFamilyMemberDto {
  userId: string;
  relationshipType: 'spouse' | 'child' | 'parent' | 'sibling' | 'relative' | 'friend' | 'caregiver' | 'doctor' | 'other';
  accessLevel?: 'full' | 'limited' | 'view_only';
  notificationPreferences?: {
    criticalAlerts?: boolean;
    warnings?: boolean;
    infoAlerts?: boolean;
    dailyDigest?: boolean;
    channels?: ('email' | 'sms' | 'push')[];
  };
  dutySchedule?: {
    enabled?: boolean;
    timeSlots?: Array<{
      dayOfWeek: number; // 0-6 (Sunday-Saturday)
      startTime: string; // HH:mm
      endTime: string; // HH:mm
    }>;
  };
}

export interface UpdateDutyScheduleDto {
  guardianId: string;
  dutySchedule: {
    enabled?: boolean;
    timeSlots?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  };
}

@Injectable()
export class FamilyAccessService {
  private readonly logger = createLogger({ serviceName: 'family-access-service' });

  constructor(
    private readonly guardianWardRepository: GuardianWardRepository,
    private readonly familyChatRepository: FamilyChatRepository,
  ) {}

  /**
   * Добавить члена семьи в качестве опекуна
   */
  async addFamilyMember(
    primaryGuardianId: string,
    wardId: string,
    addMemberDto: AddFamilyMemberDto,
  ) {
    // Проверяем, что пользователь является главным опекуном
    const guardianWard = await this.guardianWardRepository.findByGuardianAndWard(primaryGuardianId, wardId);
    if (!guardianWard) {
      throw new ForbiddenException('You are not a guardian for this ward');
    }

    // Проверяем, что пользователь еще не является опекуном
    const existing = await this.guardianWardRepository.findByGuardianAndWard(addMemberDto.userId, wardId);
    if (existing) {
      throw new ForbiddenException('User is already a guardian for this ward');
    }

    // Создаем связь опекун-подопечный
    const newGuardianWard = await this.guardianWardRepository.create({
      guardianId: addMemberDto.userId,
      wardId,
      relationship: addMemberDto.relationshipType,
    });

    // Обновляем дополнительные поля
    await this.guardianWardRepository.update(newGuardianWard.id, {
      relationshipType: addMemberDto.relationshipType,
      accessLevel: addMemberDto.accessLevel || 'limited',
      notificationPreferences: addMemberDto.notificationPreferences || {},
      dutySchedule: addMemberDto.dutySchedule || {},
      isPrimary: false,
      status: 'active',
    });

    this.logger.info(`Family member added: ${addMemberDto.userId} to ward ${wardId} by ${primaryGuardianId}`);

    return {
      success: true,
      message: 'Family member added successfully',
      data: newGuardianWard,
    };
  }

  /**
   * Получить список всех опекунов для подопечного
   */
  async getFamilyMembers(wardId: string, requesterId: string) {
    // Проверяем доступ
    const hasAccess = await this.guardianWardRepository.hasAccess(requesterId, wardId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this ward');
    }

    const guardians = await this.guardianWardRepository.findGuardiansByWardId(wardId);
    return {
      success: true,
      data: guardians,
    };
  }

  /**
   * Internal method to get guardians for ward (for service-to-service calls)
   * Skips access check - trusts internal service calls
   */
  async getGuardiansForWardInternal(wardId: string) {
    const guardians = await this.guardianWardRepository.findGuardiansByWardId(wardId);
    return guardians;
  }

  /**
   * Internal method to check access (for service-to-service calls)
   * Checks if user has access to ward
   */
  async hasAccessToWardInternal(userId: string, wardId: string): Promise<boolean> {
    return await this.guardianWardRepository.hasAccess(userId, wardId);
  }

  /**
   * Обновить расписание дежурств опекуна
   */
  async updateDutySchedule(
    primaryGuardianId: string,
    wardId: string,
    updateDto: UpdateDutyScheduleDto,
  ) {
    // Проверяем права
    const requesterGuardian = await this.guardianWardRepository.findByGuardianAndWard(primaryGuardianId, wardId);
    if (!requesterGuardian) {
      throw new ForbiddenException('You are not a guardian for this ward');
    }

    // Проверяем, что обновляем для существующего опекуна
    const targetGuardian = await this.guardianWardRepository.findByGuardianAndWard(updateDto.guardianId, wardId);
    if (!targetGuardian) {
      throw new NotFoundException('Guardian not found for this ward');
    }

    // Обновляем duty_schedule
    await this.guardianWardRepository.update(targetGuardian.id, {
      dutySchedule: updateDto.dutySchedule,
    });

    return {
      success: true,
      message: 'Duty schedule updated successfully',
    };
  }

  /**
   * Временная передача прав главного опекуна
   */
  async transferPrimaryGuardianTemporarily(
    currentPrimaryId: string,
    wardId: string,
    newPrimaryId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Проверяем, что текущий пользователь является главным опекуном
    const currentGuardian = await this.guardianWardRepository.findByGuardianAndWard(currentPrimaryId, wardId);
    if (!currentGuardian) {
      throw new ForbiddenException('You are not a guardian for this ward');
    }

    // Проверяем, что новый опекун существует
    const newGuardian = await this.guardianWardRepository.findByGuardianAndWard(newPrimaryId, wardId);
    if (!newGuardian) {
      throw new NotFoundException('Target guardian not found for this ward');
    }

    // Обновляем текущего главного опекуна
    await this.guardianWardRepository.update(currentGuardian.id, {
      isPrimary: false,
    });

    // Обновляем нового временного главного опекуна
    await this.guardianWardRepository.update(newGuardian.id, {
      isPrimary: true,
      temporaryPrimaryGuardian: true,
      temporaryPeriodStart: startDate,
      temporaryPeriodEnd: endDate,
    });

    this.logger.info(
      `Primary guardian temporarily transferred: ward ${wardId} from ${currentPrimaryId} to ${newPrimaryId}`,
    );

    return {
      success: true,
      message: 'Primary guardian temporarily transferred',
    };
  }

  /**
   * Создать сообщение в семейном чате
   */
  async createChatMessage(
    senderId: string,
    wardId: string,
    messageDto: CreateFamilyChatMessageDto,
  ) {
    // Проверяем доступ
    const hasAccess = await this.guardianWardRepository.hasAccess(senderId, wardId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this ward');
    }

    const message = await this.familyChatRepository.create({
      ...messageDto,
      wardId,
      senderId,
    });

    return {
      success: true,
      data: message,
    };
  }

  /**
   * Получить сообщения семейного чата
   */
  async getChatMessages(wardId: string, requesterId: string, limit: number = 50, offset: number = 0) {
    // Проверяем доступ
    const hasAccess = await this.guardianWardRepository.hasAccess(requesterId, wardId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this ward');
    }

    const messages = await this.familyChatRepository.findByWardId(wardId, limit, offset);
    return {
      success: true,
      data: messages,
    };
  }

  /**
   * Отметить сообщение как прочитанное
   */
  async markMessageAsRead(messageId: string, userId: string) {
    await this.familyChatRepository.markAsRead(messageId, userId);
    return {
      success: true,
      message: 'Message marked as read',
    };
  }

  /**
   * Получить количество непрочитанных сообщений
   */
  async getUnreadCount(wardId: string, userId: string) {
    const count = await this.familyChatRepository.getUnreadCount(wardId, userId);
    return {
      success: true,
      data: { count },
    };
  }

  /**
   * Создать системное сообщение об алерте
   */
  async createAlertSystemMessage(
    wardId: string,
    alertData: {
      alertId: string;
      alertType: string;
      severity: string;
      message: string;
    },
  ) {
    const message = await this.familyChatRepository.create({
      wardId,
      senderId: 'system', // Системный отправитель
      messageType: 'system_alert',
      content: alertData.message,
      metadata: {
        alertId: alertData.alertId,
        alertType: alertData.alertType,
        severity: alertData.severity,
      },
    });

    return {
      success: true,
      data: message,
    };
  }
}

