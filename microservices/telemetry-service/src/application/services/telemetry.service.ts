import { Injectable } from '@nestjs/common';
import { TelemetryRepository } from '../../infrastructure/repositories/telemetry.repository';
import { TelemetryEventPublisher } from '../../infrastructure/messaging/telemetry-event.publisher';
import { DeviceServiceClient } from '../../infrastructure/clients/device-service.client';
import { CreateTelemetryDto } from '../../infrastructure/dto/create-telemetry.dto';
import { createLogger } from '../../../../shared/libs/logger';
import { randomUUID } from 'crypto';

@Injectable()
export class TelemetryService {
  private readonly logger = createLogger({ serviceName: 'telemetry-service' });

  constructor(
    private readonly telemetryRepository: TelemetryRepository,
    private readonly eventPublisher: TelemetryEventPublisher,
    private readonly deviceServiceClient: DeviceServiceClient,
  ) {}

  async create(createTelemetryDto: CreateTelemetryDto) {
    // Get wardId from device-service
    const wardId = await this.deviceServiceClient.getWardIdByDeviceId(createTelemetryDto.deviceId);

    const telemetryId = randomUUID();
    const timestamp = new Date();

    // Save telemetry data
    await this.telemetryRepository.create({
      id: telemetryId,
      deviceId: createTelemetryDto.deviceId,
      wardId: wardId || 'unknown',
      metrics: createTelemetryDto.metrics,
      location: createTelemetryDto.location,
      timestamp,
    });

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
        metrics: createTelemetryDto.metrics,
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

  async getByWardId(wardId: string, query: any) {
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

  async getLatest(wardId: string) {
    const data = await this.telemetryRepository.findLatest(wardId);
    return {
      success: true,
      data,
    };
  }
}

