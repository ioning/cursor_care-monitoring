import { DispatcherService } from '../dispatcher.service';
import { CallRepository } from '../../../infrastructure/repositories/call.repository';
import { DispatcherRepository } from '../../../infrastructure/repositories/dispatcher.repository';
import { RiskAlertEvent } from '../../../../../../shared/types/event.types';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock('../../../../../../shared/libs/logger', () => ({
  createLogger: jest.fn(() => mockLogger),
}));

jest.mock('../../../../../../shared/libs/rabbitmq', () => ({
  publishEvent: jest.fn(),
}));

describe('DispatcherService', () => {
  let dispatcherService: DispatcherService;
  let callRepository: any;
  let dispatcherRepository: any;

  beforeEach(() => {
    callRepository = {
      create: jest.fn(),
      findByFilters: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      assignDispatcher: jest.fn(),
    };

    dispatcherRepository = {
      findAvailable: jest.fn(),
      findById: jest.fn(),
    };

    dispatcherService = new DispatcherService(callRepository, dispatcherRepository);
    jest.clearAllMocks();
  });

  describe('handleCriticalAlert', () => {
    it('should create emergency call from risk alert', async () => {
      const event: RiskAlertEvent = {
        eventId: 'event-1',
        eventType: 'ai.risk.alert',
        timestamp: new Date().toISOString(),
        version: '1.0',
        correlationId: 'corr-1',
        source: 'ai-prediction-service',
        wardId: 'ward-1',
        data: {
          alertType: 'high_fall_risk',
          riskScore: 0.85,
          confidence: 0.9,
          priority: 1,
          severity: 'high',
          recommendation: 'Call caregiver',
          modelId: 'fall-prediction-v1.1',
          modelVersion: '1.1.0',
        },
      };

      const call = {
        id: 'call-1',
        wardId: event.wardId,
        callType: 'emergency',
        priority: 'high',
        status: 'created',
      };

      const dispatcher = {
        id: 'dispatcher-1',
        name: 'John Doe',
        status: 'available',
      };

      callRepository.create.mockResolvedValue(call);
      dispatcherRepository.findAvailable.mockResolvedValue([dispatcher]);
      callRepository.assignDispatcher.mockResolvedValue(undefined);

      await dispatcherService.handleCriticalAlert(event);

      expect(callRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          wardId: event.wardId,
          callType: 'emergency',
          status: 'created',
        }),
      );
    });
  });

  describe('getCalls', () => {
    it('should return calls with filters', async () => {
      const filters = {
        status: 'active',
        priority: 'high',
        page: 1,
        limit: 20,
      };

      const calls = [
        { id: 'call-1', status: 'active', priority: 'high' },
        { id: 'call-2', status: 'active', priority: 'high' },
      ];

      callRepository.findByFilters.mockResolvedValue([calls, 2]);

      const result = await dispatcherService.getCalls(filters);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(calls);
      expect(result.meta.total).toBe(2);
    });
  });

  describe('getCall', () => {
    it('should return call by id', async () => {
      const callId = 'call-1';
      const call = {
        id: callId,
        wardId: 'ward-1',
        status: 'active',
        priority: 'high',
      };

      callRepository.findById.mockResolvedValue(call);

      const result = await dispatcherService.getCall(callId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(call);
    });
  });

  describe('updateCallStatus', () => {
    it('should update call status', async () => {
      const callId = 'call-1';
      const status = 'in_progress';

      callRepository.updateStatus.mockResolvedValue(undefined);

      const result = await dispatcherService.updateCallStatus(callId, status);

      expect(result.success).toBe(true);
      expect(callRepository.updateStatus).toHaveBeenCalledWith(callId, status);
    });
  });
});

