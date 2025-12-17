import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryRepository } from '../telemetry.repository';
import { getDatabaseConnection } from '../../../../shared/libs/database';

jest.mock('../../../../shared/libs/database', () => ({
  getDatabaseConnection: jest.fn(),
}));

describe('TelemetryRepository', () => {
  let repository: TelemetryRepository;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      query: jest.fn(),
    };

    (getDatabaseConnection as jest.Mock).mockReturnValue(mockDb);

    const module: TestingModule = await Test.createTestingModule({
      providers: [TelemetryRepository],
    }).compile();

    repository = module.get<TelemetryRepository>(TelemetryRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create telemetry record', async () => {
      const telemetryData = {
        deviceId: 'device-1',
        wardId: 'ward-1',
        metricType: 'heart_rate',
        value: 75,
        unit: 'bpm',
        qualityScore: 0.95,
        timestamp: new Date(),
      };

      const mockTelemetry = {
        id: 'telemetry-1',
        ...telemetryData,
        createdAt: new Date(),
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [mockTelemetry],
      });

      const result = await repository.create(telemetryData);

      expect(result).toEqual(mockTelemetry);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO raw_metrics'),
        expect.arrayContaining([
          telemetryData.deviceId,
          telemetryData.wardId,
          telemetryData.metricType,
          telemetryData.value,
        ]),
      );
    });
  });

  describe('findByWardId', () => {
    it('should find telemetry by ward ID with filters', async () => {
      const wardId = 'ward-1';
      const filters = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
        metricType: 'heart_rate',
        limit: 100,
      };

      const mockTelemetry = [
        {
          id: 'telemetry-1',
          wardId,
          metricType: filters.metricType,
          value: 75,
          timestamp: new Date(),
        },
      ];

      mockDb.query.mockResolvedValueOnce({
        rows: mockTelemetry,
      });

      const result = await repository.findByWardId(wardId, filters);

      expect(result).toEqual(mockTelemetry);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining([wardId]),
      );
    });

    it('should find telemetry without filters', async () => {
      const wardId = 'ward-1';
      const mockTelemetry = [
        {
          id: 'telemetry-1',
          wardId,
          metricType: 'heart_rate',
          value: 75,
        },
      ];

      mockDb.query.mockResolvedValueOnce({
        rows: mockTelemetry,
      });

      const result = await repository.findByWardId(wardId);

      expect(result).toEqual(mockTelemetry);
    });
  });

  describe('getLatest', () => {
    it('should get latest telemetry for ward', async () => {
      const wardId = 'ward-1';
      const mockTelemetry = {
        id: 'telemetry-1',
        wardId,
        metricType: 'heart_rate',
        value: 75,
        timestamp: new Date(),
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [mockTelemetry],
      });

      const result = await repository.getLatest(wardId);

      expect(result).toEqual(mockTelemetry);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DISTINCT ON'),
        [wardId],
      );
    });

    it('should return null if no telemetry found', async () => {
      const wardId = 'ward-1';

      mockDb.query.mockResolvedValueOnce({
        rows: [],
      });

      const result = await repository.getLatest(wardId);

      expect(result).toBeNull();
    });
  });

  describe('aggregateByWardId', () => {
    it('should aggregate telemetry by ward ID', async () => {
      const wardId = 'ward-1';
      const period = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      };

      const mockAggregation = {
        metricType: 'heart_rate',
        avg: 75,
        min: 60,
        max: 90,
        count: 100,
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [mockAggregation],
      });

      const result = await repository.aggregateByWardId(wardId, period);

      expect(result).toEqual([mockAggregation]);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('AVG'),
        expect.arrayContaining([wardId]),
      );
    });
  });

  describe('deleteOldRecords', () => {
    it('should delete old telemetry records', async () => {
      const olderThan = new Date('2023-01-01');

      mockDb.query.mockResolvedValueOnce({
        rowCount: 1000,
      });

      const result = await repository.deleteOldRecords(olderThan);

      expect(result).toBe(1000);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM raw_metrics'),
        [olderThan],
      );
    });
  });
});

