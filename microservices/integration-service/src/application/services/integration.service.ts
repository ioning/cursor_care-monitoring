import { Injectable } from '@nestjs/common';
import { EmailService } from '../../infrastructure/services/email.service';
import { SmsService } from '../../infrastructure/services/sms.service';
import { PushService } from '../../infrastructure/services/push.service';
import { TelegramService } from '../../infrastructure/services/telegram.service';
import { NotificationRepository } from '../../infrastructure/repositories/notification.repository';
import { NotificationTemplateService } from './notification-template.service';
import { AlertCreatedEvent } from '../../../../shared/types/event.types';
import { createLogger } from '../../../../shared/libs/logger';
import { randomUUID } from 'crypto';

@Injectable()
export class IntegrationService {
  private readonly logger = createLogger({ serviceName: 'integration-service' });

  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushService: PushService,
    private readonly telegramService: TelegramService,
    private readonly notificationRepository: NotificationRepository,
    private readonly templateService: NotificationTemplateService,
  ) {}

  async handleAlertCreated(event: AlertCreatedEvent): Promise<void> {
    const { alertId, wardId, title, description, severity, status } = event.data;

    // Get notification preferences for ward's guardians
    // In real implementation, this would query user-service
    const guardians = await this.getGuardiansForWard(wardId);

    for (const guardian of guardians) {
      const notificationId = randomUUID();
      const template = this.templateService.getAlertTemplate(severity, title, description);

      // Send notifications based on preferences
      const promises: Promise<any>[] = [];

      if (guardian.preferences?.email && guardian.email) {
        promises.push(
          this.emailService.send({
            to: guardian.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
          }).then(() =>
            this.notificationRepository.create({
              id: notificationId,
              userId: guardian.id,
              type: 'email',
              channel: 'email',
              status: 'sent',
              content: template.text,
              metadata: { alertId, wardId },
            }),
          ).catch((error) => {
            this.logger.error('Failed to send email', { error, guardianId: guardian.id });
            return this.notificationRepository.create({
              id: notificationId,
              userId: guardian.id,
              type: 'email',
              channel: 'email',
              status: 'failed',
              content: template.text,
              metadata: { alertId, wardId, error: error.message },
            });
          }),
        );
      }

      if (guardian.preferences?.sms && guardian.phone) {
        promises.push(
          this.smsService.send({
            to: guardian.phone,
            message: template.sms,
          }).then(() =>
            this.notificationRepository.create({
              id: randomUUID(),
              userId: guardian.id,
              type: 'sms',
              channel: 'sms',
              status: 'sent',
              content: template.sms,
              metadata: { alertId, wardId },
            }),
          ).catch((error) => {
            this.logger.error('Failed to send SMS', { error, guardianId: guardian.id });
          }),
        );
      }

      if (guardian.preferences?.push && guardian.pushToken) {
        promises.push(
          this.pushService.send({
            token: guardian.pushToken,
            title: template.subject,
            body: template.text,
            data: { alertId, wardId, severity },
          }).then(() =>
            this.notificationRepository.create({
              id: randomUUID(),
              userId: guardian.id,
              type: 'push',
              channel: 'push',
              status: 'sent',
              content: template.text,
              metadata: { alertId, wardId },
            }),
          ).catch((error) => {
            this.logger.error('Failed to send push', { error, guardianId: guardian.id });
          }),
        );
      }

      if (guardian.preferences?.telegram && guardian.telegramChatId) {
        promises.push(
          this.telegramService.send({
            chatId: guardian.telegramChatId,
            message: template.telegram,
          }).then(() =>
            this.notificationRepository.create({
              id: randomUUID(),
              userId: guardian.id,
              type: 'telegram',
              channel: 'telegram',
              status: 'sent',
              content: template.telegram,
              metadata: { alertId, wardId },
            }),
          ).catch((error) => {
            this.logger.error('Failed to send Telegram', { error, guardianId: guardian.id });
          }),
        );
      }

      await Promise.allSettled(promises);
    }

    this.logger.info(`Processed alert notifications: ${alertId}`, {
      alertId,
      wardId,
      guardiansCount: guardians.length,
    });
  }

  private async getGuardiansForWard(wardId: string): Promise<any[]> {
    // In real implementation, this would query user-service
    // For MVP, return mock data
    return [
      {
        id: 'guardian-1',
        email: 'guardian@example.com',
        phone: '+79991234567',
        pushToken: 'push-token-123',
        telegramChatId: '123456789',
        preferences: {
          email: true,
          sms: true,
          push: true,
          telegram: false,
        },
      },
    ];
  }
}

