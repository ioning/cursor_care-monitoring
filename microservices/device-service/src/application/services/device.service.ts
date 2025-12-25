import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DeviceRepository, type Device } from '../../infrastructure/repositories/device.repository';
import { RegisterDeviceDto } from '../../infrastructure/dto/register-device.dto';
import { UpdateDeviceDto } from '../../infrastructure/dto/update-device.dto';
import { LinkDeviceDto } from '../../infrastructure/dto/link-device.dto';
import { DeviceTelemetryDto } from '../../infrastructure/dto/device-telemetry.dto';
import { OrganizationServiceClient } from '../../infrastructure/clients/organization-service.client';
import { TelemetryServiceClient } from '../../infrastructure/clients/telemetry-service.client';
import { LocationServiceClient } from '../../infrastructure/clients/location-service.client';
import { createLogger } from '../../../../../shared/libs/logger';
import { randomUUID } from 'crypto';

@Injectable()
export class DeviceService {
  private readonly logger = createLogger({ serviceName: 'device-service' });

  constructor(
    private readonly deviceRepository: DeviceRepository,
    private readonly organizationServiceClient: OrganizationServiceClient,
    private readonly telemetryServiceClient: TelemetryServiceClient,
    private readonly locationServiceClient: LocationServiceClient,
  ) {}

  async register(userId: string, registerDeviceDto: RegisterDeviceDto) {
    const deviceId = randomUUID();
    const apiKey = this.generateApiKey();

    // Определяем организацию по серийному номеру устройства
    let organizationId: string | undefined;
    if (registerDeviceDto.serialNumber) {
      try {
        const organization = await this.organizationServiceClient.getOrganizationBySerialNumber(
          registerDeviceDto.serialNumber,
        );
        organizationId = organization.id;
        this.logger.info(`Device assigned to organization: ${organization.name}`, {
          deviceId,
          serialNumber: registerDeviceDto.serialNumber,
          organizationId: organization.id,
        });
      } catch (error: any) {
        this.logger.warn(`Failed to determine organization for device`, {
          deviceId,
          serialNumber: registerDeviceDto.serialNumber,
          error: error.message,
        });
        // Продолжаем регистрацию без организации (будет использована primary)
      }
    }

    const device = await this.deviceRepository.create({
      id: deviceId,
      userId,
      apiKey,
      ...registerDeviceDto,
    });

    this.logger.info(`Device registered: ${deviceId} by user ${userId}`, {
      deviceId,
      userId,
      deviceType: registerDeviceDto.deviceType,
      serialNumber: registerDeviceDto.serialNumber,
      organizationId,
    });

    return {
      success: true,
      data: {
        ...device,
        apiKey, // Return API key only once during registration
        organizationId, // Return organization ID for user assignment
      },
      message: 'Device registered successfully',
    };
  }

  async getDevices(userId: string, userRole: string, wardId?: string) {
    let devices: Device[];
    
    if (userRole === 'ward') {
      // Для подопечного: ищем устройства, привязанные к нему через wardId
      devices = await this.deviceRepository.findByWardId(userId);
    } else {
      // Для опекуна: ищем устройства, которые он зарегистрировал
      devices = await this.deviceRepository.findByUserId(userId, wardId);
    }
    
    return {
      success: true,
      data: devices.map((d) => ({
        ...d,
        apiKey: undefined, // Don't expose API keys in list
      })),
    };
  }

  async getDevice(userId: string, userRole: string, deviceId: string) {
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Verify user has access
    if (userRole === 'ward') {
      // Для подопечного: проверяем, что устройство привязано к нему
      if (device.wardId !== userId) {
        throw new ForbiddenException('Access denied to this device');
      }
    } else {
      // Для опекуна: проверяем, что он владелец устройства
      if (device.userId !== userId) {
        throw new ForbiddenException('Access denied to this device');
      }
    }

    return {
      success: true,
      data: {
        ...device,
        apiKey: undefined, // Don't expose API key
      },
    };
  }

  async updateDevice(userId: string, deviceId: string, updateDeviceDto: UpdateDeviceDto) {
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.userId !== userId) {
      throw new ForbiddenException('Access denied to this device');
    }

    const updated = await this.deviceRepository.update(deviceId, updateDeviceDto);

    this.logger.info(`Device updated: ${deviceId} by user ${userId}`, { deviceId, userId });

    return {
      success: true,
      data: updated,
      message: 'Device updated successfully',
    };
  }

  async deleteDevice(userId: string, deviceId: string) {
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.userId !== userId) {
      throw new ForbiddenException('Access denied to this device');
    }

    await this.deviceRepository.delete(deviceId);

    this.logger.info(`Device deleted: ${deviceId} by user ${userId}`, { deviceId, userId });

    return {
      success: true,
      message: 'Device deleted successfully',
    };
  }

  async linkDevice(userId: string, deviceId: string, linkDeviceDto: LinkDeviceDto) {
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.userId !== userId) {
      throw new ForbiddenException('Access denied to this device');
    }

    await this.deviceRepository.linkToWard(deviceId, linkDeviceDto.wardId);

    this.logger.info(`Device linked: ${deviceId} to ward ${linkDeviceDto.wardId}`, {
      deviceId,
      wardId: linkDeviceDto.wardId,
    });

    return {
      success: true,
      message: 'Device linked successfully',
    };
  }

  async unlinkDevice(userId: string, deviceId: string) {
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (device.userId !== userId) {
      throw new ForbiddenException('Access denied to this device');
    }

    await this.deviceRepository.unlinkFromWard(deviceId);

    this.logger.info(`Device unlinked: ${deviceId}`, { deviceId });

    return {
      success: true,
      message: 'Device unlinked successfully',
    };
  }

  /**
   * Internal method to get ward ID for device (for service-to-service calls)
   * Skips access check - trusts internal service calls
   */
  async getWardIdByDeviceIdInternal(deviceId: string): Promise<string | null> {
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) {
      this.logger.warn('Device not found for internal call', { deviceId });
      return null;
    }
    return device.wardId || null;
  }

  /**
   * Process telemetry data from device
   * Separates metrics and location data, routes to appropriate services
   */
  async processDeviceTelemetry(deviceId: string, telemetryDto: DeviceTelemetryDto) {
    // Verify device exists and matches
    if (telemetryDto.deviceId !== deviceId) {
      throw new BadRequestException('Device ID mismatch');
    }

    const device = await this.deviceRepository.findById(deviceId);
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (!device.wardId) {
      throw new BadRequestException('Device is not linked to a ward');
    }

    // Update last seen timestamp
    await this.deviceRepository.updateLastSeen(deviceId);

    const results: any = {
      telemetry: null,
      location: null,
    };

    // Send metrics to telemetry service
    if (telemetryDto.metrics && telemetryDto.metrics.length > 0) {
      try {
        const telemetryResult = await this.telemetryServiceClient.sendTelemetry({
          deviceId,
          metrics: telemetryDto.metrics,
        });
        results.telemetry = telemetryResult;
        this.logger.debug(`Telemetry data sent to telemetry-service for device ${deviceId}`, {
          deviceId,
          metricsCount: telemetryDto.metrics.length,
        });
      } catch (error: any) {
        this.logger.error('Failed to send telemetry to telemetry-service', {
          deviceId,
          error: error.message,
        });
        // Don't throw - continue with location if available
      }
    }

    // Send location to location service
    if (telemetryDto.location) {
      try {
        const locationResult = await this.locationServiceClient.sendLocation(device.wardId, {
          latitude: telemetryDto.location.latitude,
          longitude: telemetryDto.location.longitude,
          accuracy: telemetryDto.location.accuracy,
          source: telemetryDto.location.source,
          timestamp: new Date().toISOString(),
        });
        results.location = locationResult;
        this.logger.debug(`Location data sent to location-service for device ${deviceId}`, {
          deviceId,
          wardId: device.wardId,
        });
      } catch (error: any) {
        this.logger.error('Failed to send location to location-service', {
          deviceId,
          wardId: device.wardId,
          error: error.message,
        });
        // Don't throw - telemetry might have succeeded
      }
    }

    return {
      success: true,
      data: results,
      message: 'Device telemetry processed successfully',
    };
  }

  private generateApiKey(): string {
    // Generate a secure API key
    const prefix = 'cms_';
    const randomBytes = randomUUID().replace(/-/g, '');
    return `${prefix}${randomBytes}`;
  }
}

