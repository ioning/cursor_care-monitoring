import { Controller, Get, Param, Headers } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeviceService } from '../../application/services/device.service';
import { createLogger } from '../../../../../shared/libs/logger';

@ApiTags('internal')
@Controller('internal')
export class InternalController {
  private readonly logger = createLogger({ serviceName: 'device-service' });

  constructor(private readonly deviceService: DeviceService) {}

  /**
   * Internal endpoint for service-to-service calls
   * Get ward ID for a device without authentication
   * Protected by service token check (X-Internal-Service header)
   */
  @Get('devices/:deviceId/ward')
  @ApiOperation({ summary: '[Internal] Get ward ID for device' })
  @ApiResponse({ status: 200, description: 'Ward ID retrieved successfully' })
  async getWardIdForDevice(
    @Param('deviceId') deviceId: string,
    @Headers('x-internal-service') serviceName?: string,
  ) {
    // Basic service-to-service authentication check
    const allowedServices = ['telemetry-service', 'alert-service', 'integration-service'];
    if (serviceName && !allowedServices.includes(serviceName.toLowerCase())) {
      this.logger.warn('Unauthorized internal service call', { serviceName, deviceId });
      throw new Error('Unauthorized internal service call');
    }

    try {
      const wardId = await this.deviceService.getWardIdByDeviceIdInternal(deviceId);
      
      return {
        success: true,
        data: {
          deviceId,
          wardId,
        },
      };
    } catch (error: any) {
      this.logger.error('Failed to get ward ID for device (internal)', {
        deviceId,
        error: error.message,
      });
      throw error;
    }
  }
}

