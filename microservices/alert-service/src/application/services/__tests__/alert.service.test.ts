import { AlertService } from '../alert.service';
import { AlertStatus, AlertSeverity } from '../../../../../../shared/types/common.types';
import { RiskAlertEvent } from '../../../../../../shared/types/event.types';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

const mockRandomUUID = jest.fn();
jest.mock('crypto', () => ({
  randomUUID: () => mockRandomUUID(),
}));

jest.mock('../../../../../../shared/libs/logger', () => ({
  createLogger: jest.fn(() => mockLogger),
}));

describe('AlertService', () => {
  let alertRepository: any;
  let eventPublisher: any;
  let userServiceClient: any;
  let alertService: AlertService;

  beforeEach(() => {
    alertRepository = {
      create: jest.fn(),
      findByFilters: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };

    eventPublisher = {
      publishAlertCreated: jest.fn(),
    };

    userServiceClient = {
      hasAccessToWard: jest.fn(),
    };

    alertService = new AlertService(alertRepository, eventPublisher, userServiceClient);
    mockRandomUUID.mockReset();
    jest.clearAllMocks();
  });

  describe('handleRiskAlert', () => {
    it('creates alert and emits alert.created event', async () => {
      mockRandomUUID.mockReturnValueOnce('alert-1').mockReturnValueOnce('event-1');

      const event: RiskAlertEvent = {
        eventId: 'risk-event',
        eventType: 'ai.risk.alert',
        timestamp: new Date().toISOString(),
        version: '1.0',
        correlationId: 'corr-1',
        source: 'ai-service',
        wardId: 'ward-1',
        data: {
          alertType: 'high_fall_risk',
          riskScore: 0.85,
          confidence: 0.92,
          priority: 1,
          severity: AlertSeverity.HIGH,
          recommendation: 'Call caregiver',
          modelId: 'model-1',
          modelVersion: '1.0.0',
        },
      };

      const storedAlert = {
        id: 'alert-1',
        wardId: 'ward-1',
        alertType: 'high_fall_risk',
        title: 'Высокий риск падения',
        description: 'AI detected potential risk',
        severity: AlertSeverity.HIGH,
        status: AlertStatus.ACTIVE,
        aiConfidence: 0.92,
        riskScore: 0.85,
        priority: 1,
        dataSnapshot: {},
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      };

      alertRepository.create.mockResolvedValue(storedAlert);

      await alertService.handleRiskAlert(event);

      expect(alertRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'alert-1',
          alertType: event.data.alertType,
          severity: event.data.severity,
          aiConfidence: event.data.confidence,
        }),
      );

      expect(eventPublisher.publishAlertCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'alert.created',
          wardId: event.wardId,
          correlationId: event.correlationId,
          data: expect.objectContaining({
            alertId: storedAlert.id,
            severity: storedAlert.severity,
            alertType: storedAlert.alertType,
          }),
        }),
      );
    });
  });

  describe('getAlerts', () => {
    it('returns paginated alerts for guardian', async () => {
      alertRepository.findByFilters.mockResolvedValue([[{ id: 'alert-1' }], 5]);

      const filters = { wardId: 'ward-1', status: AlertStatus.ACTIVE, severity: AlertSeverity.HIGH, page: 2, limit: 2 };
      const result = await alertService.getAlerts('user-1', filters);

      expect(alertRepository.findByFilters).toHaveBeenCalledWith('user-1', expect.objectContaining(filters), {
        page: filters.page,
        limit: filters.limit,
      });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(5);
    });
  });

  describe('getAlert', () => {
    it('returns alert when found', async () => {
      const alert = { id: 'alert-1' };
      alertRepository.findById.mockResolvedValue(alert);

      const result = await alertService.getAlert('user-1', 'alert-1');
      expect(result.success).toBe(true);
      expect(result.data).toBe(alert);
    });

    it('throws if alert does not exist', async () => {
      alertRepository.findById.mockResolvedValue(null);

      await expect(alertService.getAlert('user-1', 'alert-404')).rejects.toThrow('Alert not found');
    });
  });

  describe('updateStatus', () => {
    it('updates status and logs audit record', async () => {
      const alert = { id: 'alert-1', status: AlertStatus.ACTIVE };
      alertRepository.findById.mockResolvedValue(alert);
      alertRepository.updateStatus.mockResolvedValue({ ...alert, status: AlertStatus.RESOLVED });

      const result = await alertService.updateStatus('user-1', 'alert-1', { status: AlertStatus.RESOLVED });

      expect(alertRepository.updateStatus).toHaveBeenCalledWith('alert-1', AlertStatus.RESOLVED);
      expect(result.data.status).toBe(AlertStatus.RESOLVED);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Alert status updated: alert-1',
        expect.objectContaining({ userId: 'user-1', newStatus: AlertStatus.RESOLVED }),
      );
    });

    it('throws if alert to update is missing', async () => {
      alertRepository.findById.mockResolvedValue(null);

      await expect(
        alertService.updateStatus('user-1', 'alert-404', { status: AlertStatus.ACKNOWLEDGED }),
      ).rejects.toThrow('Alert not found');
    });
  });
});

