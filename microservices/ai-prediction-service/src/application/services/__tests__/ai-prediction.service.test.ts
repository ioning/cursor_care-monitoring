import { AIPredictionService } from '../ai-prediction.service';
import { FallPredictionModel } from '../../../infrastructure/ml-models/fall-prediction.model';
import { PredictionRepository } from '../../../infrastructure/repositories/prediction.repository';
import { PredictionEventPublisher } from '../../../infrastructure/messaging/prediction-event.publisher';
import { TelemetryReceivedEvent } from '../../../../../../shared/types/event.types';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock('../../../../../../shared/libs/logger', () => ({
  createLogger: jest.fn(() => mockLogger),
}));

describe('AIPredictionService', () => {
  let aiPredictionService: AIPredictionService;
  let fallPredictionModel: any;
  let predictionRepository: any;
  let eventPublisher: any;

  beforeEach(() => {
    fallPredictionModel = {
      predict: jest.fn(),
    };

    predictionRepository = {
      save: jest.fn(),
      findByWardId: jest.fn(),
    };

    eventPublisher = {
      publishPredictionGenerated: jest.fn(),
      publishRiskAlert: jest.fn(),
    };

    aiPredictionService = new AIPredictionService(
      fallPredictionModel,
      predictionRepository,
      eventPublisher,
    );
    jest.clearAllMocks();
  });

  describe('processTelemetry', () => {
    it('should process telemetry and generate prediction', async () => {
      const event: TelemetryReceivedEvent = {
        eventId: 'event-1',
        eventType: 'telemetry.data.received',
        timestamp: new Date().toISOString(),
        version: '1.0',
        correlationId: 'corr-1',
        source: 'telemetry-service',
        wardId: 'ward-1',
        deviceId: 'device-1',
        data: {
          metrics: [
            { type: 'heart_rate', value: 80, unit: 'bpm' },
            { type: 'steps', value: 5000, unit: 'count' },
            { type: 'accelerometer_magnitude', value: 1.2, unit: 'g' },
          ],
          location: {
            latitude: 55.7558,
            longitude: 37.6173,
            source: 'gps',
          },
          deviceInfo: {},
        },
      };

      const prediction = {
        riskScore: 0.5,
        confidence: 0.85,
        factors: ['normal_activity', 'stable_heart_rate'],
      };

      fallPredictionModel.predict.mockResolvedValue(prediction);
      predictionRepository.save.mockResolvedValue({ id: 'pred-1' });
      eventPublisher.publishPredictionGenerated.mockResolvedValue(undefined);

      await aiPredictionService.processTelemetry(event);

      expect(fallPredictionModel.predict).toHaveBeenCalled();
      expect(predictionRepository.save).toHaveBeenCalled();
      expect(eventPublisher.publishPredictionGenerated).toHaveBeenCalled();
    });

    it('should publish risk alert when risk score exceeds threshold', async () => {
      const event: TelemetryReceivedEvent = {
        eventId: 'event-1',
        eventType: 'telemetry.data.received',
        timestamp: new Date().toISOString(),
        version: '1.0',
        correlationId: 'corr-1',
        source: 'telemetry-service',
        wardId: 'ward-1',
        deviceId: 'device-1',
        data: {
          metrics: [{ type: 'heart_rate', value: 120, unit: 'bpm' }],
          location: { latitude: 55.7558, longitude: 37.6173, source: 'gps' },
          deviceInfo: {},
        },
      };

      const highRiskPrediction = {
        riskScore: 0.85, // Above threshold of 0.7
        confidence: 0.9,
        factors: ['elevated_heart_rate', 'irregular_pattern'],
      };

      fallPredictionModel.predict.mockResolvedValue(highRiskPrediction);
      predictionRepository.save.mockResolvedValue({ id: 'pred-1' });
      eventPublisher.publishPredictionGenerated.mockResolvedValue(undefined);
      eventPublisher.publishRiskAlert.mockResolvedValue(undefined);

      await aiPredictionService.processTelemetry(event);

      expect(eventPublisher.publishRiskAlert).toHaveBeenCalled();
    });

    it('should skip prediction if insufficient features', async () => {
      const event: TelemetryReceivedEvent = {
        eventId: 'event-1',
        eventType: 'telemetry.data.received',
        timestamp: new Date().toISOString(),
        version: '1.0',
        correlationId: 'corr-1',
        source: 'telemetry-service',
        wardId: 'ward-1',
        deviceId: 'device-1',
        data: {
          metrics: [], // No metrics
          location: { latitude: 55.7558, longitude: 37.6173, source: 'gps' },
          deviceInfo: {},
        },
      };

      await aiPredictionService.processTelemetry(event);

      expect(fallPredictionModel.predict).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Insufficient features'),
        expect.any(Object),
      );
    });
  });

  describe('getPredictions', () => {
    it('should return predictions for ward', async () => {
      const wardId = 'ward-1';
      const predictions = [
        {
          id: 'pred-1',
          wardId,
          predictionType: 'fall_prediction',
          output: { riskScore: 0.5 },
          timestamp: new Date(),
        },
      ];

      predictionRepository.findByWardId.mockResolvedValue(predictions);

      const result = await aiPredictionService.getPredictions(wardId, {});

      expect(result.success).toBe(true);
      expect(result.data).toEqual(predictions);
    });
  });
});

