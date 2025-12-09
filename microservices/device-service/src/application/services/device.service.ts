import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeviceRepository } from '../../infrastructure/repositories/device.repository';
import { RegisterDeviceDto } from '../../infrastructure/dto/register-device.dto';
import { UpdateDeviceDto } from '../../infrastructure/dto/update-device.dto';
import { LinkDeviceDto } from '../../infrastructure/dto/link-device.dto';
import { createLogger } from '../../../../shared/libs/logger';
import { randomUUID } from 'crypto';

@Injectable()
export class DeviceService {
  private readonly logger = createLogger({ serviceName: 'device-service' });

  constructor(private readonly deviceRepository: DeviceRepository) {}

  async register(userId: string, registerDeviceDto: RegisterDeviceDto) {
    const deviceId = randomUUID();
    const apiKey = this.generateApiKey();

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
    });

    return {
      success: true,
      data: {
        ...device,
        apiKey, // Return API key only once during registration
      },
      message: 'Device registered successfully',
    };
  }

  async getDevices(userId: string, wardId?: string) {
    const devices = await this.deviceRepository.findByUserId(userId, wardId);
    return {
      success: true,
      data: devices.map((d) => ({
        ...d,
        apiKey: undefined, // Don't expose API keys in list
      })),
    };
  }

  async getDevice(userId: string, deviceId: string) {
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // Verify user has access
    if (device.userId !== userId) {
      throw new ForbiddenException('Access denied to this device');
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

  private generateApiKey(): string {
    // Generate a secure API key
    const prefix = 'cms_';
    const randomBytes = randomUUID().replace(/-/g, '');
    return `${prefix}${randomBytes}`;
  }
}

