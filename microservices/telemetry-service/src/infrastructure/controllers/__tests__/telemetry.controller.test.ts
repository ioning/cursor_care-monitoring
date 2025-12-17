import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryController } from '../telemetry.controller';
import { TelemetryService } from '../../application/services/telemetry.service';
import { CreateTelemetryDto } from '../../dto/create-telemetry.dto';

describe('TelemetryController', () => {
  let controller: TelemetryController;
  let telemetryService: any;

  beforeEach(async () => {
    telemetryService = {
      create: jest.fn(),
      getByWardId: jest.fn(),
      getLatest: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelemetryController],
      providers: [
        {
          provide: TelemetryService,
          useValue: telemetryService,
        },
      ],
    }).compile();

    controller = module.get<TelemetryController>(TelemetryController);
  });

  describe('create', () => {
    it('should create telemetry data', async () => {
      const createTelemetryDto: CreateTelemetryDto = {
        deviceId: 'device-1',
        metrics: [
          {
            type: 'heart_rate',
            value: 75,
            unit: 'bpm',
          },
        ],
        location: {
          latitude: 55.7558,
          longitude: 37.6173,
          source: 'gps',
        },
        timestamp: new Date(),
      };

      const expectedResult = {
        success: true,
        data: {
          id: 'telemetry-1',
          deviceId: createTelemetryDto.deviceId,
        },
      };

      telemetryService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createTelemetryDto);

      expect(result).toEqual(expectedResult);
      expect(telemetryService.create).toHaveBeenCalledWith(createTelemetryDto);
    });
  });

  describe('getWardTelemetry', () => {
    it('should get telemetry data for ward', async () => {
      const wardId = 'ward-1';
      const from = '2024-01-01T00:00:00Z';
      const to = '2024-01-02T00:00:00Z';
      const metricType = 'heart_rate';
      const page = 1;
      const limit = 10;

      const expectedResult = {
        success: true,
        data: [
          {
            id: 'telemetry-1',
            wardId,
            metrics: [{ type: metricType, value: 75 }],
          },
        ],
        pagination: {
          page,
          limit,
          total: 1,
        },
      };

      telemetryService.getByWardId.mockResolvedValue(expectedResult);

      const result = await controller.getWardTelemetry(wardId, from, to, metricType, page, limit);

      expect(result).toEqual(expectedResult);
      expect(telemetryService.getByWardId).toHaveBeenCalledWith(wardId, {
        from,
        to,
        metricType,
        page,
        limit,
      });
    });

    it('should get telemetry data without optional parameters', async () => {
      const wardId = 'ward-1';
      const from = '2024-01-01T00:00:00Z';
      const to = '2024-01-02T00:00:00Z';

      const expectedResult = {
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
        },
      };

      telemetryService.getByWardId.mockResolvedValue(expectedResult);

      const result = await controller.getWardTelemetry(wardId, from, to);

      expect(result).toEqual(expectedResult);
      expect(telemetryService.getByWardId).toHaveBeenCalledWith(wardId, {
        from,
        to,
        metricType: undefined,
        page: undefined,
        limit: undefined,
      });
    });
  });

  describe('getLatest', () => {
    it('should get latest telemetry data for ward', async () => {
      const wardId = 'ward-1';
      const expectedResult = {
        success: true,
        data: {
          id: 'telemetry-1',
          wardId,
          metrics: [{ type: 'heart_rate', value: 75 }],
          timestamp: new Date(),
        },
      };

      telemetryService.getLatest.mockResolvedValue(expectedResult);

      const result = await controller.getLatest(wardId);

      expect(result).toEqual(expectedResult);
      expect(telemetryService.getLatest).toHaveBeenCalledWith(wardId);
    });
  });
});

