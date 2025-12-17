import { AnalyticsService } from '../analytics.service';
import { ReportRepository } from '../../../infrastructure/repositories/report.repository';
import { ReportTemplateRepository } from '../../../infrastructure/repositories/report-template.repository';
import { ReportFileRepository } from '../../../infrastructure/repositories/report-file.repository';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock('../../../../../../shared/libs/logger', () => ({
  createLogger: jest.fn(() => mockLogger),
}));

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let reportRepository: any;
  let templateRepository: any;
  let reportFileRepository: any;

  beforeEach(() => {
    reportRepository = {
      create: jest.fn(),
      findByWardId: jest.fn(),
      findById: jest.fn(),
    };

    templateRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
    };

    reportFileRepository = {
      save: jest.fn(),
      findByReportId: jest.fn(),
    };

    analyticsService = new AnalyticsService(
      reportRepository,
      templateRepository,
      reportFileRepository,
    );
    jest.clearAllMocks();
  });

  describe('getWardHealthReport', () => {
    it('should generate health report for ward', async () => {
      const wardId = 'ward-1';
      const period = '7d';

      const result = await analyticsService.getWardHealthReport(wardId, period);

      expect(result.success).toBe(true);
      expect(result.data.wardId).toBe(wardId);
      expect(result.data.period).toBe(period);
      expect(result.data.summary).toBeDefined();
      expect(result.data.trends).toBeDefined();
      expect(result.data.recommendations).toBeDefined();
    });
  });

  describe('generateReport', () => {
    it('should generate report successfully', async () => {
      const reportDto = {
        wardId: 'ward-1',
        reportType: 'health_summary',
        period: '30d',
        metrics: ['heart_rate', 'activity'],
      };

      const template = {
        id: 'template-1',
        name: 'Health Summary',
        structure: {},
      };

      const report = {
        id: 'report-1',
        wardId: reportDto.wardId,
        reportType: reportDto.reportType,
        status: 'completed',
      };

      templateRepository.findById.mockResolvedValue(template);
      reportRepository.create.mockResolvedValue(report);

      const result = await analyticsService.generateReport(reportDto);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('getReports', () => {
    it('should return reports for ward', async () => {
      const wardId = 'ward-1';
      const reports = [
        { id: 'report-1', wardId, reportType: 'health_summary' },
        { id: 'report-2', wardId, reportType: 'activity_analysis' },
      ];

      reportRepository.findByWardId.mockResolvedValue(reports);

      const result = await analyticsService.getReports(wardId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(reports);
    });
  });

  describe('getReportTemplates', () => {
    it('should return all report templates', async () => {
      const templates = [
        { id: 'template-1', name: 'Health Summary' },
        { id: 'template-2', name: 'Activity Report' },
      ];

      templateRepository.findAll.mockResolvedValue(templates);

      const result = await analyticsService.getReportTemplates();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(templates);
    });
  });
});

