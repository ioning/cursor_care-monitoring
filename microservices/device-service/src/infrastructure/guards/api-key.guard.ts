import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { DeviceRepository } from '../repositories/device.repository';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly deviceRepository: DeviceRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] || request.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // API key should start with 'cms_', but accept both formats
    const cleanApiKey = apiKey;

    // Find device by API key
    const device = await this.deviceRepository.findByApiKey(cleanApiKey);

    if (!device) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Attach device to request for use in controller
    request.device = device;

    return true;
  }
}

