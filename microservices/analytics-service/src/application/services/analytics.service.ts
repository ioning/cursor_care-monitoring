import { Injectable } from '@nestjs/common';
import { ReportRepository } from '../../infrastructure/repositories/report.repository';
import { ReportTemplateRepository } from '../../infrastructure/repositories/report-template.repository';
import { ReportFileRepository } from '../../infrastructure/repositories/report-file.repository';
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
  ) {}

  async getWardHealthReport(wardId: string, period: string) {
    // In real implementation, would aggregate data from telemetry, alerts, etc.
    const report = {
      wardId,
      period,
      summary: {
        totalAlerts: 0,
        criticalAlerts: 0,
        averageHeartRate: 0,
        averageActivity: 0,
        healthScore: 85,
      },
      trends: {
        heartRate: [],
        activity: [],
        alerts: [],
      },
      recommendations: [
        'Регулярно проверяйте показатели здоровья',
        'Обеспечьте достаточную физическую активность',
      ],
    };

    return {
      success: true,
      data: report,
    };
  }

  async getSystemStats() {
    // In real implementation, would aggregate system-wide statistics
    const stats = {
      totalUsers: 0,
      totalWards: 0,
      totalDevices: 0,
      activeAlerts: 0,
      systemHealth: 'good',
    };

    return {
      success: true,
      data: stats,
    };
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

