import { Injectable } from '@nestjs/common';
import { AlertSeverity } from '../../../../../shared/types/common.types';

export interface NotificationTemplate {
  subject: string;
  html: string;
  text: string;
  sms: string;
  telegram: string;
}

@Injectable()
export class NotificationTemplateService {
  getAlertTemplate(severity: AlertSeverity, title: string, description?: string): NotificationTemplate {
    const emoji = this.getSeverityEmoji(severity);
    const urgency = this.getUrgencyText(severity);

    const subject = `${emoji} ${title} - Care Monitoring`;
    const text = `${title}\n\n${description || 'Обнаружена проблема, требующая внимания.'}\n\nУровень: ${urgency}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: ${this.getSeverityColor(severity)};">${emoji} ${title}</h2>
        <p>${description || 'Обнаружена проблема, требующая внимания.'}</p>
        <p><strong>Уровень:</strong> ${urgency}</p>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Care Monitoring System
        </p>
      </div>
    `;
    const sms = `${emoji} ${title}. ${description || 'Требуется внимание.'} Уровень: ${urgency}`;
    const telegram = `*${emoji} ${title}*\n\n${description || 'Обнаружена проблема, требующая внимания.'}\n\nУровень: ${urgency}`;

    return { subject, html, text, sms, telegram };
  }

  private getSeverityEmoji(severity: AlertSeverity): string {
    const emojis: Record<AlertSeverity, string> = {
      critical: '🚨',
      high: '⚠️',
      medium: 'ℹ️',
      low: '📌',
    };
    return emojis[severity] || '📌';
  }

  private getUrgencyText(severity: AlertSeverity): string {
    const texts: Record<AlertSeverity, string> = {
      critical: 'Критический',
      high: 'Высокий',
      medium: 'Средний',
      low: 'Низкий',
    };
    return texts[severity] || 'Неизвестно';
  }

  private getSeverityColor(severity: AlertSeverity): string {
    const colors: Record<AlertSeverity, string> = {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#6b7280',
    };
    return colors[severity] || '#6b7280';
  }
}

