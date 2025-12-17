import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from '../analytics.controller';
import { AnalyticsService } from '../../application/services/analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: any;

  beforeEach(async () => {
    analyticsService = {
      getWardHealthReport: jest.fn(),
      getSystemStats: jest.fn(),
      generateReport: jest.fn(),
      generateComparativeReport: jest.fn(),
      scheduleReport: jest.fn(),
      getUserReports: jest.fn(),
      exportReport: jest.fn(),
      getReportFiles: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: analyticsService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
  });

  describe('getWardHealthReport', () => {
    it('should get health report for ward with period', async () => {
      const wardId = 'ward-1';
      const period = '30d';
      const expectedResult = {
        success: true,
        data: {
          wardId,
          period,
          healthScore: 85,
          metrics: [],
        },
      };

      analyticsService.getWardHealthReport.mockResolvedValue(expectedResult);

      const result = await controller.getWardHealthReport(wardId, period);

      expect(result).toEqual(expectedResult);
      expect(analyticsService.getWardHealthReport).toHaveBeenCalledWith(wardId, period);
    });

    it('should use default period if not provided', async () => {
      const wardId = 'ward-1';
      const expectedResult = {
        success: true,
        data: {
          wardId,
          period: '7d',
          healthScore: 85,
        },
      };

      analyticsService.getWardHealthReport.mockResolvedValue(expectedResult);

      const result = await controller.getWardHealthReport(wardId);

      expect(result).toEqual(expectedResult);
      expect(analyticsService.getWardHealthReport).toHaveBeenCalledWith(wardId, '7d');
    });
  });

  describe('getSystemStats', () => {
    it('should get system statistics', async () => {
      const expectedResult = {
        success: true,
        data: {
          totalWards: 100,
          totalUsers: 500,
          totalAlerts: 50,
        },
      };

      analyticsService.getSystemStats.mockResolvedValue(expectedResult);

      const result = await controller.getSystemStats();

      expect(result).toEqual(expectedResult);
      expect(analyticsService.getSystemStats).toHaveBeenCalled();
    });
  });

  describe('generateReport', () => {
    it('should generate report', async () => {
      const userId = 'user-1';
      const body = {
        type: 'health',
        wardId: 'ward-1',
        period: '30d',
      };
      const expectedResult = {
        success: true,
        data: {
          reportId: 'report-1',
          status: 'generating',
        },
      };

      analyticsService.generateReport.mockResolvedValue(expectedResult);

      const result = await controller.generateReport({ user: { id: userId } } as any, body);

      expect(result).toEqual(expectedResult);
      expect(analyticsService.generateReport).toHaveBeenCalledWith(userId, body);
    });
  });

  describe('generateComparativeReport', () => {
    it('should generate comparative report', async () => {
      const userId = 'user-1';
      const body = {
        wardIds: ['ward-1', 'ward-2'],
        period: '30d',
      };
      const expectedResult = {
        success: true,
        data: {
          reportId: 'report-1',
          status: 'generating',
        },
      };

      analyticsService.generateComparativeReport.mockResolvedValue(expectedResult);

      const result = await controller.generateComparativeReport({ user: { id: userId } } as any, body);

      expect(result).toEqual(expectedResult);
      expect(analyticsService.generateComparativeReport).toHaveBeenCalledWith(userId, body);
    });
  });

  describe('scheduleReport', () => {
    it('should schedule report generation', async () => {
      const userId = 'user-1';
      const body = {
        type: 'health',
        schedule: 'weekly',
        wardId: 'ward-1',
      };
      const expectedResult = {
        success: true,
        data: {
          scheduleId: 'schedule-1',
          status: 'scheduled',
        },
      };

      analyticsService.scheduleReport.mockResolvedValue(expectedResult);

      const result = await controller.scheduleReport({ user: { id: userId } } as any, body);

      expect(result).toEqual(expectedResult);
      expect(analyticsService.scheduleReport).toHaveBeenCalledWith(userId, body);
    });
  });

  describe('getUserReports', () => {
    it('should get user reports with limit and offset', async () => {
      const userId = 'user-1';
      const limit = 20;
      const offset = 0;
      const expectedResult = {
        success: true,
        data: [
          {
            id: 'report-1',
            userId,
            type: 'health',
          },
        ],
      };

      analyticsService.getUserReports.mockResolvedValue(expectedResult);

      const result = await controller.getUserReports({ user: { id: userId } } as any, limit, offset);

      expect(result).toEqual(expectedResult);
      expect(analyticsService.getUserReports).toHaveBeenCalledWith(userId, limit, offset);
    });

    it('should use default limit and offset if not provided', async () => {
      const userId = 'user-1';
      const expectedResult = {
        success: true,
        data: [],
      };

      analyticsService.getUserReports.mockResolvedValue(expectedResult);

      const result = await controller.getUserReports({ user: { id: userId } } as any);

      expect(result).toEqual(expectedResult);
      expect(analyticsService.getUserReports).toHaveBeenCalledWith(userId, 50, 0);
    });
  });

  describe('exportReport', () => {
    it('should export report to format', async () => {
      const reportId = 'report-1';
      const body = {
        format: 'pdf' as const,
      };
      const expectedResult = {
        success: true,
        data: {
          reportId,
          format: body.format,
          fileUrl: 'https://example.com/report.pdf',
        },
      };

      analyticsService.exportReport.mockResolvedValue(expectedResult);

      const result = await controller.exportReport(reportId, body);

      expect(result).toEqual(expectedResult);
      expect(analyticsService.exportReport).toHaveBeenCalledWith(reportId, body.format);
    });
  });

  describe('getReportFiles', () => {
    it('should get report files', async () => {
      const reportId = 'report-1';
      const expectedResult = {
        success: true,
        data: [
          {
            id: 'file-1',
            reportId,
            format: 'pdf',
            url: 'https://example.com/report.pdf',
          },
        ],
      };

      analyticsService.getReportFiles.mockResolvedValue(expectedResult);

      const result = await controller.getReportFiles(reportId);

      expect(result).toEqual(expectedResult);
      expect(analyticsService.getReportFiles).toHaveBeenCalledWith(reportId);
    });
  });
});

