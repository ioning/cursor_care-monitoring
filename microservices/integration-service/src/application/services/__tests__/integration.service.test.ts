import { IntegrationService } from '../integration.service';
import { EmailService } from '../../../infrastructure/services/email.service';
import { SmsService } from '../../../infrastructure/services/sms.service';
import { PushService } from '../../../infrastructure/services/push.service';
import { TelegramService } from '../../../infrastructure/services/telegram.service';
import { NotificationRepository } from '../../../infrastructure/repositories/notification.repository';
import { NotificationTemplateService } from '../notification-template.service';
import { UserServiceClient } from '../../../infrastructure/clients/user-service.client';
import { AlertCreatedEvent } from '../../../../../../shared/types/event.types';
import { AlertSeverity } from '../../../../../../shared/types/common.types';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock('../../../../../../shared/libs/logger', () => ({
  createLogger: jest.fn(() => mockLogger),
}));

describe('IntegrationService', () => {
  let integrationService: IntegrationService;
  let emailService: any;
  let smsService: any;
  let pushService: any;
  let telegramService: any;
  let notificationRepository: any;
  let templateService: any;
  let userServiceClient: any;

  beforeEach(() => {
    emailService = {
      send: jest.fn(),
    };

    smsService = {
      send: jest.fn(),
    };

    pushService = {
      send: jest.fn(),
    };

    telegramService = {
      send: jest.fn(),
    };

    notificationRepository = {
      create: jest.fn(),
    };

    templateService = {
      getAlertTemplate: jest.fn(),
    };

    userServiceClient = {
      getGuardiansForWard: jest.fn(),
    };

    integrationService = new IntegrationService(
      emailService,
      smsService,
      pushService,
      telegramService,
      notificationRepository,
      templateService,
      userServiceClient,
    );
    jest.clearAllMocks();
  });

  describe('handleAlertCreated', () => {
    it('should send notifications to guardians', async () => {
      const event: AlertCreatedEvent = {
        eventId: 'event-1',
        eventType: 'alert.created',
        timestamp: new Date().toISOString(),
        version: '1.0',
        correlationId: 'corr-1',
        source: 'alert-service',
        wardId: 'ward-1',
        data: {
          alertId: 'alert-1',
          wardId: 'ward-1',
          title: 'Test Alert',
          description: 'Test Description',
          severity: AlertSeverity.HIGH,
          status: 'active',
        },
      };

      const guardians = [
        {
          id: 'guardian-1',
          email: 'guardian1@example.com',
          phone: '+1234567890',
          preferences: { email: true, sms: true },
        },
      ];

      const template = {
        subject: 'Test Alert',
        html: '<p>Test</p>',
        text: 'Test',
        sms: 'Test Alert',
        telegram: 'Test Alert',
      };

      userServiceClient.getGuardiansForWard.mockResolvedValue(guardians);
      templateService.getAlertTemplate.mockReturnValue(template);
      emailService.send.mockResolvedValue({ success: true });
      smsService.send.mockResolvedValue({ success: true });
      notificationRepository.create.mockResolvedValue({ id: 'notif-1' });

      await integrationService.handleAlertCreated(event);

      expect(userServiceClient.getGuardiansForWard).toHaveBeenCalledWith('ward-1');
      expect(templateService.getAlertTemplate).toHaveBeenCalled();
      expect(emailService.send).toHaveBeenCalled();
      expect(smsService.send).toHaveBeenCalled();
    });

    it('should handle notification failures gracefully', async () => {
      const event: AlertCreatedEvent = {
        eventId: 'event-1',
        eventType: 'alert.created',
        timestamp: new Date().toISOString(),
        version: '1.0',
        correlationId: 'corr-1',
        source: 'alert-service',
        wardId: 'ward-1',
        data: {
          alertId: 'alert-1',
          wardId: 'ward-1',
          title: 'Test Alert',
          description: 'Test Description',
          severity: AlertSeverity.HIGH,
          status: 'active',
        },
      };

      const guardians = [
        {
          id: 'guardian-1',
          email: 'guardian1@example.com',
          preferences: { email: true },
        },
      ];

      const template = {
        subject: 'Test Alert',
        html: '<p>Test</p>',
        text: 'Test',
        sms: 'Test',
        telegram: 'Test',
      };

      userServiceClient.getGuardiansForWard.mockResolvedValue(guardians);
      templateService.getAlertTemplate.mockReturnValue(template);
      emailService.send.mockRejectedValue(new Error('Email service unavailable'));
      notificationRepository.create.mockResolvedValue({ id: 'notif-1' });

      await integrationService.handleAlertCreated(event);

      expect(notificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
        }),
      );
    });
  });
});

