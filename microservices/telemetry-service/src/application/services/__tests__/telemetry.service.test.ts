import { TelemetryService } from '../telemetry.service';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock('../../../../../../shared/libs/logger', () => ({
  createLogger: jest.fn(() => mockLogger),
}));

describe('TelemetryService', () => {
  let telemetryService: TelemetryService;
  let telemetryRepository: any;
  let eventPublisher: any;
  let deviceServiceClient: any;

  beforeEach(() => {
    telemetryRepository = {
      create: jest.fn(),
      findByWardId: jest.fn(),
      findLatest: jest.fn(),
    };

    eventPublisher = {
      publishTelemetryReceived: jest.fn(),
    };

    deviceServiceClient = {
      getWardIdByDeviceId: jest.fn(),
    };

    telemetryService = new TelemetryService(telemetryRepository, eventPublisher, deviceServiceClient);
    jest.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('persists telemetry data and publishes event', async () => {
      deviceServiceClient.getWardIdByDeviceId.mockResolvedValue('ward-1');

      const dto = {
        deviceId: 'device-1',
        metrics: [
          { type: 'heart_rate', value: 80, unit: 'bpm' },
          { type: 'steps', value: 120, unit: 'count' },
        ],
        location: {
          latitude: 1,
          longitude: 2,
          source: 'gps',
        },
      };

      const result = await telemetryService.create(dto);

      expect(result.success).toBe(true);
      expect(result.data.metricsCount).toBe(dto.metrics.length);

      const savedPayload = telemetryRepository.create.mock.calls[0][0];
      expect(savedPayload.deviceId).toBe(dto.deviceId);
      expect(savedPayload.metrics).toEqual(dto.metrics);
      expect(savedPayload.wardId).toBe('ward-1');

      expect(deviceServiceClient.getWardIdByDeviceId).toHaveBeenCalledWith(dto.deviceId);
      expect(eventPublisher.publishTelemetryReceived).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'telemetry.data.received',
          deviceId: dto.deviceId,
          data: expect.objectContaining({
            metrics: dto.metrics,
            location: dto.location,
          }),
        }),
      );

      expect(result.data.telemetryId).toBe(savedPayload.id);
    });

    it('falls back to placeholder ward when device service returns null', async () => {
      deviceServiceClient.getWardIdByDeviceId.mockResolvedValue(null);

      await telemetryService.create({
        deviceId: 'device-2',
        metrics: [{ type: 'spo2', value: 97 }],
      });

      const savedPayload = telemetryRepository.create.mock.calls[0][0];
      expect(savedPayload.wardId).toBe('unknown');
    });
  });

  describe('getByWardId', () => {
    it('returns paginated telemetry feed', async () => {
      telemetryRepository.findByWardId.mockResolvedValue([[{ metric_type: 'heart_rate' }], 42]);

      const result = await telemetryService.getByWardId('ward-1', { metricType: 'heart_rate', page: 2, limit: 10 });

      expect(telemetryRepository.findByWardId).toHaveBeenCalledWith(
        'ward-1',
        expect.objectContaining({ metricType: 'heart_rate', page: 2, limit: 10 }),
      );
      expect(result.meta).toEqual({
        page: 2,
        limit: 10,
        total: 42,
        totalPages: Math.ceil(42 / 10),
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getLatest', () => {
    it('returns latest metrics snapshot', async () => {
      const snapshot = { wardId: 'ward-1', metrics: { heart_rate: { value: 80 } } };
      telemetryRepository.findLatest.mockResolvedValue(snapshot);

      const result = await telemetryService.getLatest('ward-1');

      expect(result.success).toBe(true);
      expect(result.data).toBe(snapshot);
      expect(telemetryRepository.findLatest).toHaveBeenCalledWith('ward-1');
    });
  });
});

