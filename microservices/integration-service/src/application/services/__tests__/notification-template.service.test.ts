import { NotificationTemplateService } from '../notification-template.service';
import { AlertSeverity } from '../../../../../../shared/types/common.types';

describe('NotificationTemplateService', () => {
  let service: NotificationTemplateService;

  beforeEach(() => {
    service = new NotificationTemplateService();
  });

  describe('getAlertTemplate', () => {
    it('should generate template for critical alert', () => {
      const template = service.getAlertTemplate(
        AlertSeverity.CRITICAL,
        'Critical Alert',
        'This is a critical situation',
      );

      expect(template.subject).toContain('🚨');
      expect(template.subject).toContain('Critical Alert');
      expect(template.html).toContain('Critical Alert');
      expect(template.text).toContain('Critical Alert');
      expect(template.sms).toContain('🚨');
      expect(template.telegram).toContain('🚨');
    });

    it('should generate template for high alert', () => {
      const template = service.getAlertTemplate(AlertSeverity.HIGH, 'High Alert');

      expect(template.subject).toContain('⚠️');
      expect(template.html).toContain('High Alert');
    });

    it('should generate template for medium alert', () => {
      const template = service.getAlertTemplate(AlertSeverity.MEDIUM, 'Medium Alert');

      expect(template.subject).toContain('ℹ️');
      expect(template.html).toContain('Medium Alert');
    });

    it('should generate template for low alert', () => {
      const template = service.getAlertTemplate(AlertSeverity.LOW, 'Low Alert');

      expect(template.subject).toContain('📌');
      expect(template.html).toContain('Low Alert');
    });

    it('should use default description if not provided', () => {
      const template = service.getAlertTemplate(AlertSeverity.HIGH, 'Test Alert');

      expect(template.text).toContain('Обнаружена проблема, требующая внимания');
      expect(template.html).toContain('Обнаружена проблема, требующая внимания');
    });

    it('should include all required fields', () => {
      const template = service.getAlertTemplate(AlertSeverity.HIGH, 'Test Alert', 'Description');

      expect(template).toHaveProperty('subject');
      expect(template).toHaveProperty('html');
      expect(template).toHaveProperty('text');
      expect(template).toHaveProperty('sms');
      expect(template).toHaveProperty('telegram');
    });
  });
});

