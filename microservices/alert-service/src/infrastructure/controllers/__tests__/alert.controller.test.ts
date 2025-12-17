import { Test, TestingModule } from '@nestjs/testing';
import { AlertController } from '../alert.controller';
import { AlertService } from '../../application/services/alert.service';
import { UpdateAlertStatusDto } from '../../dto/update-alert-status.dto';

describe('AlertController', () => {
  let controller: AlertController;
  let alertService: any;

  beforeEach(async () => {
    alertService = {
      getAlerts: jest.fn(),
      getAlert: jest.fn(),
      updateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertController],
      providers: [
        {
          provide: AlertService,
          useValue: alertService,
        },
      ],
    }).compile();

    controller = module.get<AlertController>(AlertController);
  });

  describe('getAlerts', () => {
    it('should get all alerts for user', async () => {
      const userId = 'user-1';
      const expectedResult = {
        success: true,
        data: [
          {
            id: 'alert-1',
            wardId: 'ward-1',
            severity: 'high',
            status: 'active',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
        },
      };

      alertService.getAlerts.mockResolvedValue(expectedResult);

      const result = await controller.getAlerts({ user: { id: userId } } as any);

      expect(result).toEqual(expectedResult);
      expect(alertService.getAlerts).toHaveBeenCalledWith(userId, {
        wardId: undefined,
        status: undefined,
        severity: undefined,
        page: undefined,
        limit: undefined,
      });
    });

    it('should get alerts with filters', async () => {
      const userId = 'user-1';
      const wardId = 'ward-1';
      const status = 'active';
      const severity = 'high';
      const page = 1;
      const limit = 10;

      const expectedResult = {
        success: true,
        data: [
          {
            id: 'alert-1',
            wardId,
            severity,
            status,
          },
        ],
        pagination: {
          page,
          limit,
          total: 1,
        },
      };

      alertService.getAlerts.mockResolvedValue(expectedResult);

      const result = await controller.getAlerts(
        { user: { id: userId } } as any,
        wardId,
        status,
        severity,
        page,
        limit,
      );

      expect(result).toEqual(expectedResult);
      expect(alertService.getAlerts).toHaveBeenCalledWith(userId, {
        wardId,
        status,
        severity,
        page,
        limit,
      });
    });
  });

  describe('getAlert', () => {
    it('should get alert by ID', async () => {
      const userId = 'user-1';
      const alertId = 'alert-1';
      const expectedResult = {
        success: true,
        data: {
          id: alertId,
          wardId: 'ward-1',
          severity: 'high',
          status: 'active',
        },
      };

      alertService.getAlert.mockResolvedValue(expectedResult);

      const result = await controller.getAlert({ user: { id: userId } } as any, alertId);

      expect(result).toEqual(expectedResult);
      expect(alertService.getAlert).toHaveBeenCalledWith(userId, alertId);
    });
  });

  describe('updateStatus', () => {
    it('should update alert status', async () => {
      const userId = 'user-1';
      const alertId = 'alert-1';
      const updateStatusDto: UpdateAlertStatusDto = {
        status: 'resolved',
        notes: 'Issue resolved',
      };

      const expectedResult = {
        success: true,
        data: {
          id: alertId,
          status: updateStatusDto.status,
        },
      };

      alertService.updateStatus.mockResolvedValue(expectedResult);

      const result = await controller.updateStatus(
        { user: { id: userId } } as any,
        alertId,
        updateStatusDto,
      );

      expect(result).toEqual(expectedResult);
      expect(alertService.updateStatus).toHaveBeenCalledWith(userId, alertId, updateStatusDto);
    });
  });
});

