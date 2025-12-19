import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { WardAccessPermissionRepository } from '../../infrastructure/repositories/ward-access-permission.repository';
import { WardAccessAuditRepository, CreateAuditLogDto } from '../../infrastructure/repositories/ward-access-audit.repository';
import { GuardianWardRepository } from '../../infrastructure/repositories/guardian-ward.repository';
import { createLogger } from '../../../../../shared/libs/logger';
import { GrantAccessDto } from '../../infrastructure/dto/grant-access.dto';

@Injectable()
export class WardAccessPermissionService {
  private readonly logger = createLogger({ serviceName: 'ward-access-permission-service' });

  constructor(
    private readonly permissionRepository: WardAccessPermissionRepository,
    private readonly auditRepository: WardAccessAuditRepository,
    private readonly guardianWardRepository: GuardianWardRepository,
  ) {}

  /**
   * Создать права доступа для пользователя к подопечному
   */
  async grantAccess(
    grantorId: string,
    wardId: string,
    userId: string,
    permissions: GrantAccessDto,
  ): Promise<WardAccessPermissionRepository['create'] extends (...args: any[]) => Promise<infer R> ? R : never> {
    // Проверяем, что grantor имеет право предоставлять доступ (является главным опекуном)
    const hasAccess = await this.guardianWardRepository.hasAccess(grantorId, wardId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to grant access to this ward');
    }

    // Проверяем, что пользователь еще не имеет доступа
    const existing = await this.permissionRepository.findByWardAndUser(wardId, userId);
    if (existing && existing.status === 'active') {
      throw new BadRequestException('User already has active access to this ward');
    }

    // Создаем права доступа
    const permission = await this.permissionRepository.create({
      wardId,
      userId,
      grantedBy: grantorId,
      accessLevel: permissions.accessLevel,
      permissions: permissions.permissions,
      accessStartDate: permissions.accessStartDate ? new Date(permissions.accessStartDate) : undefined,
      accessEndDate: permissions.accessEndDate ? new Date(permissions.accessEndDate) : undefined,
      isTemporary: permissions.isTemporary,
      comment: permissions.comment,
    });

    // Логируем действие
    await this.auditRepository.create({
      wardId,
      userId: grantorId,
      actionType: 'grant_access',
      actionDetails: {
        grantedUserId: userId,
        permissionId: permission.id,
        accessLevel: permission.accessLevel,
      },
      resourceType: 'permission',
      resourceId: permission.id,
      severity: 'info',
    });

    this.logger.info(`Access granted: user ${userId} to ward ${wardId} by ${grantorId}`);

    return permission;
  }

  /**
   * Получить список пользователей с доступом к подопечному
   */
  async getWardAccessList(wardId: string, requesterId: string): Promise<any[]> {
    // Проверяем доступ
    const hasAccess = await this.guardianWardRepository.hasAccess(requesterId, wardId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this ward');
    }

    const permissions = await this.permissionRepository.findByWardId(wardId);
    
    // Логируем просмотр
    await this.auditRepository.create({
      wardId,
      userId: requesterId,
      actionType: 'view_access_list',
      resourceType: 'permission',
      severity: 'info',
    });

    return permissions;
  }

  /**
   * Обновить права доступа
   */
  async updatePermission(
    updaterId: string,
    permissionId: string,
    updates: Partial<NonNullable<GrantAccessDto['permissions']>>,
  ) {
    // Получаем текущие права
    const permission = await this.permissionRepository.findById(permissionId);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    
    // Проверяем права на обновление (только главный опекун может обновлять)
    const hasAccess = await this.guardianWardRepository.hasAccess(updaterId, permission.wardId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to update this access');
    }

    // Обновляем права
    const updated = await this.permissionRepository.update(permissionId, updates as any);

    // Логируем
    await this.auditRepository.create({
      wardId: updated.wardId,
      userId: updaterId,
      actionType: 'update_permission',
      actionDetails: { permissionId, updates },
      resourceType: 'permission',
      resourceId: permissionId,
      severity: 'info',
    });

    return updated;
  }

  /**
   * Отозвать права доступа
   */
  async revokeAccess(revokerId: string, permissionId: string) {
    const permission = await this.permissionRepository.findById(permissionId);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    // Проверяем права на отзыв
    const hasAccess = await this.guardianWardRepository.hasAccess(revokerId, permission.wardId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to revoke this access');
    }

    await this.permissionRepository.revoke(permissionId);

    // Логируем
    await this.auditRepository.create({
      wardId: permission.wardId,
      userId: revokerId,
      actionType: 'revoke_access',
      actionDetails: { permissionId, revokedUserId: permission.userId },
      resourceType: 'permission',
      resourceId: permissionId,
      severity: 'warning',
    });

    this.logger.info(`Access revoked: permission ${permissionId} by ${revokerId}`);
  }

  /**
   * Получить историю доступа (аудит)
   */
  async getAccessHistory(
    wardId: string,
    requesterId: string,
    filters?: {
      userId?: string;
      actionType?: string;
      severity?: string;
      from?: Date;
      to?: Date;
      limit?: number;
      offset?: number;
    },
  ) {
    // Проверяем доступ
    const hasAccess = await this.guardianWardRepository.hasAccess(requesterId, wardId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this ward');
    }

    return this.auditRepository.findByWardId(wardId, filters);
  }

  /**
   * Проверить права пользователя на выполнение действия
   */
  async checkPermission(
    userId: string,
    wardId: string,
    action: string,
  ): Promise<boolean> {
    const permission = await this.permissionRepository.findByWardAndUser(wardId, userId);
    
    if (!permission || permission.status !== 'active') {
      return false;
    }

    // Проверяем временные ограничения
    if (permission.isTemporary) {
      const now = new Date();
      if (permission.accessStartDate && now < permission.accessStartDate) {
        return false;
      }
      if (permission.accessEndDate && now > permission.accessEndDate) {
        // Автоматически помечаем как истекший
        await this.permissionRepository.update(permission.id, { status: 'expired' });
        return false;
      }
    }

    // Маппинг действий на права
    const actionPermissionMap: Record<string, keyof typeof permission> = {
      'view_telemetry': 'canViewTelemetry',
      'view_heart_rate': 'canViewHeartRate',
      'view_blood_pressure': 'canViewBloodPressure',
      'view_oxygen_saturation': 'canViewOxygenSaturation',
      'view_temperature': 'canViewTemperature',
      'view_activity': 'canViewActivity',
      'view_alerts': 'canViewAlerts',
      'view_critical_alerts': 'canViewCriticalAlerts',
      'view_warnings': 'canViewWarnings',
      'view_info_alerts': 'canViewInfoAlerts',
      'manage_alerts': 'canManageAlerts',
      'view_reports': 'canViewReports',
      'view_weekly_reports': 'canViewWeeklyReports',
      'view_custom_reports': 'canViewCustomReports',
      'export_reports': 'canExportReports',
      'view_devices': 'canViewDevices',
      'manage_devices': 'canManageDevices',
      'configure_devices': 'canConfigureDevices',
      'modify_alert_thresholds': 'canModifyAlertThresholds',
      'manage_notifications': 'canManageNotifications',
      'view_financial_info': 'canViewFinancialInfo',
    };

    const permissionKey = actionPermissionMap[action];
    if (!permissionKey) {
      // Если действие не определено, проверяем по уровню доступа
      return permission.accessLevel === 'admin' || permission.accessLevel === 'editor';
    }

    return permission[permissionKey] === true;
  }

  /**
   * Проверить подозрительную активность
   */
  async checkSuspiciousActivity(wardId: string, userId: string): Promise<boolean> {
    return this.auditRepository.detectSuspiciousActivity(wardId, userId);
  }
}

