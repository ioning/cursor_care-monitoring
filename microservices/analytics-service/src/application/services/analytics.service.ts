import { Injectable } from '@nestjs/common';
import { ReportRepository } from '../../infrastructure/repositories/report.repository';
import { ReportTemplateRepository } from '../../infrastructure/repositories/report-template.repository';
import { ReportFileRepository } from '../../infrastructure/repositories/report-file.repository';
import { TelemetryServiceClient } from '../../infrastructure/clients/telemetry-service.client';
import { AlertServiceClient } from '../../infrastructure/clients/alert-service.client';
import { UserServiceClient } from '../../infrastructure/clients/user-service.client';
import { createLogger } from '../../../../../shared/libs/logger';

export interface GenerateReportDto {
  wardId?: string;
  templateId?: string;
  reportType?: string;
  period?: string;
  metrics?: string[];
  includeTrends?: boolean;
  includeStatistics?: boolean;
  includeAiRecommendations?: boolean;
  includeAlertsAnalysis?: boolean;
  recipients?: string[];
  exportFormats?: string[];
}

export interface GenerateComparativeReportDto {
  wardId: string;
  templateId?: string;
  period1: { from: string; to: string };
  period2: { from: string; to: string };
  metrics?: string[];
  recipients?: string[];
}

export interface ScheduleReportDto {
  wardId?: string;
  templateId: string;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number; // 0-6 для weekly
    dayOfMonth?: number; // 1-31 для monthly
    time: string; // HH:mm
  };
  recipients?: string[];
}

@Injectable()
export class AnalyticsService {
  private readonly logger = createLogger({ serviceName: 'analytics-service' });

  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly templateRepository: ReportTemplateRepository,
    private readonly reportFileRepository: ReportFileRepository,
    private readonly telemetryServiceClient: TelemetryServiceClient,
    private readonly alertServiceClient: AlertServiceClient,
    private readonly userServiceClient: UserServiceClient,
  ) {}

  async getWardHealthReport(wardId: string, period: string, token?: string) {
    // Calculate date range from period
    const periodDays = this.parsePeriod(period);
    const to = new Date();
    const from = new Date(to.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Fetch data from services
    const [latestTelemetry, telemetryHistory, alerts] = await Promise.all([
      this.telemetryServiceClient.getLatestTelemetry(wardId, token),
      this.telemetryServiceClient.getTelemetryHistory(wardId, from.toISOString(), to.toISOString(), 1000, token),
      this.alertServiceClient.getAlerts('', { wardId }, token),
    ]);

    // Calculate summary statistics
    const totalAlerts = alerts.length;
    const criticalAlerts = alerts.filter((a: any) => a.severity === 'critical').length;

    // Calculate average heart rate from telemetry
    let averageHeartRate = 0;
    let heartRateCount = 0;
    let averageActivity = 0;
    let activityCount = 0;

    if (telemetryHistory && Array.isArray(telemetryHistory)) {
      for (const record of telemetryHistory) {
        if (record.metrics) {
          const heartRate = record.metrics.heart_rate || record.metrics.find((m: any) => m.type === 'heart_rate');
          if (heartRate) {
            const value = typeof heartRate === 'object' ? heartRate.value : heartRate;
            if (typeof value === 'number' && value > 0) {
              averageHeartRate += value;
              heartRateCount++;
            }
          }

          const steps = record.metrics.steps || record.metrics.find((m: any) => m.type === 'steps');
          if (steps) {
            const value = typeof steps === 'object' ? steps.value : steps;
            if (typeof value === 'number' && value >= 0) {
              averageActivity += value;
              activityCount++;
            }
          }
        }
      }
    }

    if (heartRateCount > 0) {
      averageHeartRate = Math.round(averageHeartRate / heartRateCount);
    }
    if (activityCount > 0) {
      averageActivity = Math.round(averageActivity / activityCount);
    }

    // Calculate health score (0-100)
    let healthScore = 100;
    healthScore -= criticalAlerts * 20; // -20 for each critical alert
    healthScore -= (totalAlerts - criticalAlerts) * 5; // -5 for each non-critical alert
    if (averageHeartRate > 0) {
      if (averageHeartRate < 50 || averageHeartRate > 120) {
        healthScore -= 15; // Abnormal heart rate
      }
    }
    if (averageActivity < 1000) {
      healthScore -= 10; // Low activity
    }
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Build trends
    const trends = {
      heartRate: this.buildTrendData(telemetryHistory, 'heart_rate', periodDays),
      activity: this.buildTrendData(telemetryHistory, 'steps', periodDays),
      alerts: this.buildAlertTrends(alerts, from, to, periodDays),
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      totalAlerts,
      criticalAlerts,
      averageHeartRate,
      averageActivity,
      healthScore,
    });

    const report = {
      wardId,
      period,
      summary: {
        totalAlerts,
        criticalAlerts,
        averageHeartRate,
        averageActivity,
        healthScore,
      },
      trends,
      recommendations,
      generatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: report,
    };
  }

  private parsePeriod(period: string): number {
    const match = period.match(/^(\d+)([dwmy])$/);
    if (!match) return 7; // Default to 7 days

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'd':
        return value;
      case 'w':
        return value * 7;
      case 'm':
        return value * 30;
      case 'y':
        return value * 365;
      default:
        return 7;
    }
  }

  private buildTrendData(telemetryHistory: any[], metricType: string, days: number): any[] {
    if (!telemetryHistory || !Array.isArray(telemetryHistory)) {
      return [];
    }

    const buckets = Math.min(days, 30); // Max 30 data points
    const bucketSize = days / buckets;
    const now = Date.now();
    const data: any[] = [];

    for (let i = 0; i < buckets; i++) {
      const bucketStart = now - (buckets - i) * bucketSize * 24 * 60 * 60 * 1000;
      const bucketEnd = bucketStart + bucketSize * 24 * 60 * 60 * 1000;

      const bucketRecords = telemetryHistory.filter((record: any) => {
        const recordTime = new Date(record.timestamp || record.createdAt).getTime();
        return recordTime >= bucketStart && recordTime < bucketEnd;
      });

      let sum = 0;
      let count = 0;

      for (const record of bucketRecords) {
        if (record.metrics) {
          const metric = record.metrics[metricType] || record.metrics.find((m: any) => m.type === metricType);
          if (metric) {
            const value = typeof metric === 'object' ? metric.value : metric;
            if (typeof value === 'number') {
              sum += value;
              count++;
            }
          }
        }
      }

      data.push({
        date: new Date(bucketStart).toISOString(),
        value: count > 0 ? Math.round(sum / count) : 0,
      });
    }

    return data;
  }

  private buildAlertTrends(alerts: any[], from: Date, to: Date, days: number): any[] {
    if (!alerts || !Array.isArray(alerts)) {
      return [];
    }

    const buckets = Math.min(days, 30);
    const bucketSize = days / buckets;
    const data: any[] = [];

    for (let i = 0; i < buckets; i++) {
      const bucketStart = to.getTime() - (buckets - i) * bucketSize * 24 * 60 * 60 * 1000;
      const bucketEnd = bucketStart + bucketSize * 24 * 60 * 60 * 1000;

      const bucketAlerts = alerts.filter((alert: any) => {
        const alertTime = new Date(alert.createdAt || alert.triggeredAt).getTime();
        return alertTime >= bucketStart && alertTime < bucketEnd;
      });

      data.push({
        date: new Date(bucketStart).toISOString(),
        count: bucketAlerts.length,
        critical: bucketAlerts.filter((a: any) => a.severity === 'critical').length,
      });
    }

    return data;
  }

  private generateRecommendations(stats: {
    totalAlerts: number;
    criticalAlerts: number;
    averageHeartRate: number;
    averageActivity: number;
    healthScore: number;
  }): string[] {
    const recommendations: string[] = [];

    if (stats.criticalAlerts > 0) {
      recommendations.push('Обнаружены критические алерты. Требуется немедленное внимание.');
    }

    if (stats.totalAlerts > 5) {
      recommendations.push('Зафиксировано большое количество алертов. Рекомендуется провести дополнительное обследование.');
    }

    if (stats.averageHeartRate > 0) {
      if (stats.averageHeartRate < 50) {
        recommendations.push('Пульс ниже нормы. Рекомендуется консультация с врачом.');
      } else if (stats.averageHeartRate > 120) {
        recommendations.push('Пульс выше нормы. Рекомендуется снизить физическую активность.');
      }
    }

    if (stats.averageActivity < 1000) {
      recommendations.push('Низкая физическая активность. Рекомендуется увеличить ежедневную активность.');
    }

    if (stats.healthScore < 70) {
      recommendations.push('Общий показатель здоровья ниже нормы. Рекомендуется комплексное обследование.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Показатели здоровья в норме. Продолжайте регулярный мониторинг.');
    }

    return recommendations;
  }

  async getSystemStats(token?: string) {
    // Try to get stats from user service
    const userStats = await this.userServiceClient.getSystemStats(token);

    // Get active alerts
    const activeAlerts = await this.alertServiceClient.getAlerts('', { status: 'active' }, token);

    const stats = {
      totalUsers: userStats?.totalUsers || 0,
      totalWards: userStats?.totalWards || 0,
      totalDevices: 0, // Would need device-service client
      activeAlerts: activeAlerts.length,
      systemHealth: this.calculateSystemHealth(activeAlerts),
    };

    return {
      success: true,
      data: stats,
    };
  }

  private calculateSystemHealth(activeAlerts: any[]): 'excellent' | 'good' | 'fair' | 'poor' {
    const criticalAlerts = activeAlerts.filter((a: any) => a.severity === 'critical').length;
    const highAlerts = activeAlerts.filter((a: any) => a.severity === 'high').length;

    if (criticalAlerts === 0 && highAlerts === 0) {
      return 'excellent';
    } else if (criticalAlerts === 0 && highAlerts < 5) {
      return 'good';
    } else if (criticalAlerts < 3 && highAlerts < 10) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  async generateReport(userId: string, generateDto: GenerateReportDto) {
    let template = null;
    if (generateDto.templateId) {
      template = await this.templateRepository.findById(generateDto.templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      // Увеличиваем счетчик использования
      await this.templateRepository.incrementUsageCount(generateDto.templateId);
    }

    const reportId = await this.reportRepository.create({
      userId,
      reportType: generateDto.reportType || 'health',
      filters: {
        wardId: generateDto.wardId,
        period: generateDto.period || '7d',
        metrics: generateDto.metrics || [],
      },
      status: 'generating',
      templateId: generateDto.templateId,
      templateName: template?.name,
      reportConfig: {
        includeTrends: generateDto.includeTrends ?? template?.includeTrends ?? true,
        includeStatistics: generateDto.includeStatistics ?? template?.includeStatistics ?? true,
        includeAiRecommendations: generateDto.includeAiRecommendations ?? template?.includeAiRecommendations ?? true,
        includeAlertsAnalysis: generateDto.includeAlertsAnalysis ?? template?.includeAlertsAnalysis ?? true,
        metrics: generateDto.metrics || template?.metricsConfig || [],
      },
      recipients: generateDto.recipients || [],
      exportFormats: generateDto.exportFormats || ['pdf'],
    });

    // В реальной реализации здесь будет асинхронная генерация отчета
    // Пока просто помечаем как завершенный
    await this.reportRepository.updateStatus(reportId, 'completed');

    this.logger.info(`Report generation started: ${reportId} by user ${userId}`);

    return {
      success: true,
      data: { reportId },
      message: 'Report generation started',
    };
  }

  async generateComparativeReport(userId: string, comparativeDto: GenerateComparativeReportDto) {
    let template = null;
    if (comparativeDto.templateId) {
      template = await this.templateRepository.findById(comparativeDto.templateId);
      if (template) {
        await this.templateRepository.incrementUsageCount(comparativeDto.templateId);
      }
    }

    const reportId = await this.reportRepository.create({
      userId,
      reportType: 'comparative',
      filters: {
        wardId: comparativeDto.wardId,
        metrics: comparativeDto.metrics || [],
      },
      status: 'generating',
      templateId: comparativeDto.templateId,
      templateName: template?.name,
      isComparative: true,
      comparisonPeriods: {
        period1: comparativeDto.period1,
        period2: comparativeDto.period2,
      },
      recipients: comparativeDto.recipients || [],
      exportFormats: ['pdf'],
    });

    await this.reportRepository.updateStatus(reportId, 'completed');

    this.logger.info(`Comparative report generation started: ${reportId} by user ${userId}`);

    return {
      success: true,
      data: { reportId },
      message: 'Comparative report generation started',
    };
  }

  async scheduleReport(userId: string, scheduleDto: ScheduleReportDto) {
    const template = await this.templateRepository.findById(scheduleDto.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Создаем cron expression из расписания
    const scheduleConfig = this.buildScheduleConfig(scheduleDto.schedule);

    const reportId = await this.reportRepository.create({
      userId,
      reportType: 'scheduled',
      filters: {
        wardId: scheduleDto.wardId,
        period: template.defaultPeriod || '7d',
      },
      status: 'generating',
      templateId: scheduleDto.templateId,
      templateName: template.name,
      reportConfig: {
        includeTrends: template.includeTrends,
        includeStatistics: template.includeStatistics,
        includeAiRecommendations: template.includeAiRecommendations,
        includeAlertsAnalysis: template.includeAlertsAnalysis,
        metrics: template.metricsConfig || [],
      },
      recipients: scheduleDto.recipients || [],
      exportFormats: ['pdf'],
      scheduledGeneration: true,
      scheduleConfig,
    });

    this.logger.info(`Report scheduled: ${reportId} by user ${userId}`);

    return {
      success: true,
      data: { reportId },
      message: 'Report scheduled successfully',
    };
  }

  async exportReport(reportId: string, format: 'pdf' | 'csv' | 'json' | 'xlsx' | 'hl7_fhir') {
    const report = await this.reportRepository.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    // Проверяем, существует ли уже файл в этом формате
    let reportFile = await this.reportFileRepository.findByReportIdAndFormat(reportId, format);
    
    if (!reportFile) {
      // В реальной реализации здесь будет генерация файла
      // Пока создаем запись о файле
      const filePath = `/reports/${reportId}/${format}/${Date.now()}.${format}`;
      reportFile = await this.reportFileRepository.create({
        reportId,
        fileFormat: format,
        filePath,
        mimeType: this.getMimeType(format),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
      });
    }

    return {
      success: true,
      data: {
        fileId: reportFile.id,
        filePath: reportFile.filePath,
        format: reportFile.fileFormat,
        downloadUrl: `/api/reports/${reportId}/files/${reportFile.id}/download`,
      },
    };
  }

  async getReportFiles(reportId: string) {
    const files = await this.reportFileRepository.findByReportId(reportId);
    return {
      success: true,
      data: files,
    };
  }

  async getUserReports(userId: string, limit: number = 50, offset: number = 0) {
    const reports = await this.reportRepository.findByUserId(userId, limit, offset);
    return {
      success: true,
      data: reports,
    };
  }

  async getScheduledReports() {
    const reports = await this.reportRepository.findScheduledReports();
    return {
      success: true,
      data: reports,
    };
  }

  private buildScheduleConfig(schedule: ScheduleReportDto['schedule']): any {
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    let cronExpression = '';
    if (schedule.frequency === 'daily') {
      cronExpression = `${minutes} ${hours} * * *`;
    } else if (schedule.frequency === 'weekly') {
      cronExpression = `${minutes} ${hours} * * ${schedule.dayOfWeek || 0}`;
    } else if (schedule.frequency === 'monthly') {
      cronExpression = `${minutes} ${hours} ${schedule.dayOfMonth || 1} * *`;
    }

    return {
      frequency: schedule.frequency,
      cronExpression,
      time: schedule.time,
      dayOfWeek: schedule.dayOfWeek,
      dayOfMonth: schedule.dayOfMonth,
    };
  }

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      csv: 'text/csv',
      json: 'application/json',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      hl7_fhir: 'application/fhir+json',
    };
    return mimeTypes[format] || 'application/octet-stream';
  }
}

