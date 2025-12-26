import { Injectable, ForbiddenException } from '@nestjs/common';
import { TelemetryRepository } from '../../infrastructure/repositories/telemetry.repository';
import { TelemetryEventPublisher } from '../../infrastructure/messaging/telemetry-event.publisher';
import { DeviceServiceClient } from '../../infrastructure/clients/device-service.client';
import { LocationServiceClient } from '../../infrastructure/clients/location-service.client';
import { AlertServiceClient } from '../../infrastructure/clients/alert-service.client';
import { UserServiceClient } from '../../infrastructure/clients/user-service.client';
import { CreateTelemetryDto } from '../../infrastructure/dto/create-telemetry.dto';
import { createLogger } from '../../../../../shared/libs/logger';
import { randomUUID } from 'crypto';

interface CriticalMetric {
  type: string;
  value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
}

@Injectable()
export class TelemetryService {
  private readonly logger = createLogger({ serviceName: 'telemetry-service' });

  constructor(
    private readonly telemetryRepository: TelemetryRepository,
    private readonly eventPublisher: TelemetryEventPublisher,
    private readonly deviceServiceClient: DeviceServiceClient,
    private readonly locationServiceClient: LocationServiceClient,
    private readonly alertServiceClient: AlertServiceClient,
    private readonly userServiceClient: UserServiceClient,
  ) {}

  async create(createTelemetryDto: CreateTelemetryDto) {
    // Get wardId from device-service
    const wardId = await this.deviceServiceClient.getWardIdByDeviceId(createTelemetryDto.deviceId);

    const telemetryId = randomUUID();
    const timestamp = new Date();
    const fallbackMetricTimestamp = timestamp.toISOString();
    const metricsForEvent = createTelemetryDto.metrics.map((m) => ({
      ...m,
      timestamp: m.timestamp ?? fallbackMetricTimestamp,
    }));

    // Save telemetry data
    await this.telemetryRepository.create({
      id: telemetryId,
      deviceId: createTelemetryDto.deviceId,
      wardId: wardId || 'unknown',
      metrics: createTelemetryDto.metrics,
      location: createTelemetryDto.location,
      timestamp,
    });

    // Check for critical metrics and create immediate alerts
    if (wardId && wardId !== 'unknown') {
      const criticalMetrics = this.detectCriticalMetrics(createTelemetryDto.metrics);
      for (const critical of criticalMetrics) {
        try {
          await this.alertServiceClient.createImmediateAlert(wardId, {
            alertType: critical.type,
            title: critical.title,
            description: critical.description,
            severity: critical.severity,
            dataSnapshot: {
              metricType: critical.type,
              metricValue: critical.value,
              timestamp: timestamp.toISOString(),
            },
          });
          this.logger.warn(`Critical metric detected: ${critical.type} for ward ${wardId}`, {
            wardId,
            metricType: critical.type,
            value: critical.value,
            severity: critical.severity,
          });
        } catch (error: any) {
          this.logger.warn('Failed to create immediate alert for critical metric', {
            wardId,
            metricType: critical.type,
            error: error.message,
          });
        }
      }
    }

    // If location data is provided, send it to location-service
    if (createTelemetryDto.location && wardId && wardId !== 'unknown') {
      try {
        await this.locationServiceClient.recordLocation(wardId, {
          latitude: createTelemetryDto.location.latitude,
          longitude: createTelemetryDto.location.longitude,
          accuracy: createTelemetryDto.location.accuracy,
          source: createTelemetryDto.location.source || 'device',
          timestamp,
        });
        this.logger.debug(`Location forwarded to location-service for ward ${wardId}`);
      } catch (error: any) {
        // Log but don't fail - location service might be unavailable
        this.logger.warn('Failed to forward location to location-service', {
          wardId,
          error: error.message,
        });
      }
    }

    // Publish event
    await this.eventPublisher.publishTelemetryReceived({
      eventId: randomUUID(),
      eventType: 'telemetry.data.received',
      timestamp: timestamp.toISOString(),
      version: '1.0',
      correlationId: randomUUID(),
      source: 'telemetry-service',
      wardId: wardId || 'unknown',
      deviceId: createTelemetryDto.deviceId,
      data: {
        metrics: metricsForEvent,
        location: createTelemetryDto.location,
        deviceInfo: {},
      },
    });

    this.logger.info(`Telemetry data saved: ${telemetryId}`, {
      deviceId: createTelemetryDto.deviceId,
      metricsCount: createTelemetryDto.metrics.length,
    });

    return {
      success: true,
      data: {
        telemetryId,
        deviceId: createTelemetryDto.deviceId,
        wardId,
        metricsCount: createTelemetryDto.metrics.length,
        processedAt: timestamp.toISOString(),
      },
      message: 'Telemetry data saved successfully',
    };
  }

  async getByWardId(wardId: string, query: any, userId?: string, userRole?: string) {
    // Log received parameters for debugging
    this.logger.debug(`getByWardId called: userId=${userId}, userRole=${userRole}, wardId=${wardId}`);
    
    // Check access if user info is provided
    if (userId && userRole) {
      // Normalize role to lowercase for comparison
      const normalizedRole = userRole.toLowerCase();
      // Admin, dispatcher have full access
      if (normalizedRole === 'admin' || normalizedRole === 'dispatcher') {
        this.logger.info(`Access granted for ${userRole} (${normalizedRole}) ${userId} to ward ${wardId}`);
      } else {
        this.logger.debug(`Checking access for ${userRole} ${userId} to ward ${wardId}`);
        const hasAccess = await this.userServiceClient.hasAccessToWard(userId, wardId, userRole);
        this.logger.info(`Access check result for ${userRole} ${userId} to ward ${wardId}: ${hasAccess}`);
        if (!hasAccess) {
          throw new ForbiddenException('You do not have access to this ward\'s telemetry data');
        }
      }
    } else {
      this.logger.warn(`Access check skipped: userId=${userId}, userRole=${userRole}`);
    }

    const { from, to, metricType, page = 1, limit = 20 } = query;
    const [data, total] = await this.telemetryRepository.findByWardId(wardId, {
      from,
      to,
      metricType,
      page,
      limit,
    });

    return {
      success: true,
      data,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLatest(wardId: string, userId?: string, userRole?: string) {
    // Log received parameters for debugging
    this.logger.debug(`getLatest called: userId=${userId}, userRole=${userRole}, wardId=${wardId}`);
    
    // Check access if user info is provided
    if (userId && userRole) {
      // Normalize role to lowercase for comparison
      const normalizedRole = userRole.toLowerCase();
      // Admin, dispatcher have full access
      if (normalizedRole === 'admin' || normalizedRole === 'dispatcher') {
        this.logger.info(`Access granted for ${userRole} (${normalizedRole}) ${userId} to ward ${wardId}`);
      } else {
        this.logger.debug(`Checking access for ${userRole} ${userId} to ward ${wardId}`);
        const hasAccess = await this.userServiceClient.hasAccessToWard(userId, wardId, userRole);
        this.logger.info(`Access check result for ${userRole} ${userId} to ward ${wardId}: ${hasAccess}`);
        if (!hasAccess) {
          throw new ForbiddenException('You do not have access to this ward\'s telemetry data');
        }
      }
    } else {
      this.logger.warn(`Access check skipped: userId=${userId}, userRole=${userRole}`);
    }

    const data = await this.telemetryRepository.findLatest(wardId);
    return {
      success: true,
      data,
    };
  }

  /**
   * Detect critical metrics that require immediate alerts
   */
  private detectCriticalMetrics(metrics: Array<{ type: string; value: number; unit?: string }>): CriticalMetric[] {
    const critical: CriticalMetric[] = [];

    for (const metric of metrics) {
      const type = metric.type.toLowerCase();
      const value = metric.value;

      // Fall detection - immediate critical alert
      if (type === 'fall_detected' && value === 1) {
        critical.push({
          type: 'fall_detected',
          value,
          severity: 'critical',
          title: 'Обнаружено падение',
          description: 'Браслет зафиксировал падение. Требуется немедленная проверка состояния подопечного.',
        });
        continue;
      }

      // SpO2 (Насыщение кислородом)
      if (type === 'spo2' || type === 'oxygen_saturation') {
        if (value < 85) {
          critical.push({
            type: 'low_oxygen_critical',
            value,
            severity: 'critical',
            title: 'Критическое снижение насыщения кислородом',
            description: `Насыщение кислородом критически низкое: ${value}%. Требуется немедленная медицинская помощь.`,
          });
        } else if (value < 90) {
          critical.push({
            type: 'low_oxygen_high',
            value,
            severity: 'high',
            title: 'Низкое насыщение кислородом',
            description: `Насыщение кислородом низкое: ${value}%. Требуется мониторинг и возможная медицинская помощь.`,
          });
        }
        continue;
      }

      // Heart Rate (Пульс)
      if (type === 'heart_rate' || type === 'hr') {
        if (value < 40) {
          critical.push({
            type: 'low_heart_rate_critical',
            value,
            severity: 'critical',
            title: 'Критически низкий пульс',
            description: `Пульс критически низкий: ${value} уд/мин. Возможна брадикардия. Требуется немедленная медицинская помощь.`,
          });
        } else if (value < 50) {
          critical.push({
            type: 'low_heart_rate_high',
            value,
            severity: 'high',
            title: 'Низкий пульс',
            description: `Пульс низкий: ${value} уд/мин. Требуется мониторинг.`,
          });
        } else if (value > 120) {
          critical.push({
            type: 'high_heart_rate_high',
            value,
            severity: 'high',
            title: 'Высокий пульс (тахикардия)',
            description: `Пульс повышен: ${value} уд/мин. Возможна тахикардия. Требуется мониторинг.`,
          });
        }
        continue;
      }

      // Temperature (Температура)
      if (type === 'temperature' || type === 'temp') {
        if (value < 35 || value > 39) {
          critical.push({
            type: 'temperature_critical',
            value,
            severity: 'critical',
            title: value < 35 ? 'Гипотермия' : 'Высокая температура',
            description: `Температура ${value < 35 ? 'критически низкая' : 'критически высокая'}: ${value}°C. Требуется немедленная медицинская помощь.`,
          });
        } else if (value > 38.5) {
          critical.push({
            type: 'temperature_high',
            value,
            severity: 'high',
            title: 'Лихорадка',
            description: `Температура повышена: ${value}°C. Требуется мониторинг.`,
          });
        }
        continue;
      }
    }

    return critical;
  }
}

