import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AlertService } from '../../application/services/alert.service';
import { createLogger } from '../../../../../shared/libs/logger';

@ApiTags('internal')
@Controller('internal')
export class InternalController {
  private readonly logger = createLogger({ serviceName: 'alert-service' });

  constructor(private readonly alertService: AlertService) {}

  /**
   * Internal endpoint for service-to-service calls
   * Create alert without authentication
   * Protected by service token check (X-Internal-Service header)
   */
  @Post('create')
  @ApiOperation({ summary: '[Internal] Create immediate alert' })
  @ApiResponse({ status: 201, description: 'Alert created successfully' })
  async createAlert(
    @Body() body: {
      wardId: string;
      alertType: string;
      title: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      dataSnapshot?: Record<string, any>;
    },
    @Headers('x-internal-service') serviceName?: string,
  ) {
    // Basic service-to-service authentication check
    const allowedServices = ['telemetry-service', 'integration-service', 'location-service'];
    if (serviceName && !allowedServices.includes(serviceName.toLowerCase())) {
      this.logger.warn('Unauthorized internal service call', { serviceName });
      throw new Error('Unauthorized internal service call');
    }

    try {
      await this.alertService.createImmediateAlert(body.wardId, {
        alertType: body.alertType,
        title: body.title,
        description: body.description,
        severity: body.severity,
        dataSnapshot: body.dataSnapshot,
      });

      return {
        success: true,
        message: 'Alert created successfully',
      };
    } catch (error: any) {
      this.logger.error('Failed to create alert (internal)', {
        wardId: body.wardId,
        error: error.message,
      });
      throw error;
    }
  }
}

