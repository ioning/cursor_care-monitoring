import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AlertRepository } from '../../infrastructure/repositories/alert.repository';
import { AlertEventPublisher } from '../../infrastructure/messaging/alert-event.publisher';
import { RiskAlertEvent } from '../../../../shared/types/event.types';
import { UpdateAlertStatusDto } from '../../infrastructure/dto/update-alert-status.dto';
import { createLogger } from '../../../../shared/libs/logger';
import { randomUUID } from 'crypto';

@Injectable()
export class AlertService {
  private readonly logger = createLogger({ serviceName: 'alert-service' });

  constructor(
    private readonly alertRepository: AlertRepository,
    private readonly eventPublisher: AlertEventPublisher,
  ) {}

  async handleRiskAlert(event: RiskAlertEvent): Promise<void> {
    const alertId = randomUUID();

    const alert = await this.alertRepository.create({
      id: alertId,
      wardId: event.wardId || 'unknown',
      alertType: event.data.alertType,
      title: this.getAlertTitle(event.data.alertType),
      description: event.data.recommendation || 'AI detected potential risk',
      severity: event.data.severity,
      status: 'active',
      aiConfidence: event.data.confidence,
      riskScore: event.data.riskScore,
      priority: event.data.priority,
      dataSnapshot: {
        modelId: event.data.modelId,
        modelVersion: event.data.modelVersion,
      },
    });

    // Publish alert created event
    await this.eventPublisher.publishAlertCreated({
      eventId: randomUUID(),
      eventType: 'alert.created',
      timestamp: new Date().toISOString(),
      version: '1.0',
      correlationId: event.correlationId,
      source: 'alert-service',
      wardId: event.wardId,
      data: {
        alertId: alert.id,
        title: alert.title,
        description: alert.description,
        alertType: alert.alertType,
        severity: alert.severity,
        status: alert.status,
        aiConfidence: alert.aiConfidence,
        triggeredAt: alert.createdAt.toISOString(),
      },
    });

    this.logger.info(`Alert created from risk event: ${alertId}`, {
      alertId,
      wardId: event.wardId,
      severity: alert.severity,
    });
  }

  async getAlerts(userId: string, filters: any) {
    const { wardId, status, severity, page = 1, limit = 20 } = filters;
    const [alerts, total] = await this.alertRepository.findByFilters(
      userId,
      { wardId, status, severity },
      { page, limit },
    );

    return {
      success: true,
      data: alerts,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAlert(userId: string, alertId: string) {
    const alert = await this.alertRepository.findById(alertId);
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    // Verify user has access (should check guardian-ward relationship)
    // For MVP, simplified check
    return {
      success: true,
      data: alert,
    };
  }

  async updateStatus(userId: string, alertId: string, updateStatusDto: UpdateAlertStatusDto) {
    const alert = await this.alertRepository.findById(alertId);
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    const updated = await this.alertRepository.updateStatus(alertId, updateStatusDto.status);

    this.logger.info(`Alert status updated: ${alertId}`, {
      alertId,
      userId,
      newStatus: updateStatusDto.status,
    });

    return {
      success: true,
      data: updated,
      message: 'Alert status updated successfully',
    };
  }

  private getAlertTitle(alertType: string): string {
    const titles: Record<string, string> = {
      high_fall_risk: 'Высокий риск падения',
      health_deterioration: 'Ухудшение состояния здоровья',
      anomaly_detected: 'Обнаружена аномалия',
      device_offline: 'Устройство не в сети',
    };
    return titles[alertType] || 'Предупреждение';
  }
}

