import { Controller, Get, Post, Body, Query, UseGuards, Headers } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationService } from '../../application/services/integration.service';
import { SmsService } from '../../infrastructure/services/sms.service';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';
import { createLogger } from '../../../../../shared/libs/logger';

@ApiTags('integrations')
@Controller()
export class IntegrationController {
  private readonly logger = createLogger({ serviceName: 'integration-service' });

  constructor(
    private readonly integrationService: IntegrationService,
    private readonly smsService: SmsService,
  ) {}

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification history' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getNotifications(@Query('userId') userId: string) {
    // Implementation would query notification repository
    return {
      success: true,
      data: [],
      message: 'Notifications retrieved successfully',
    };
  }

  /**
   * Internal endpoint for service-to-service SMS sending
   * Protected by X-Internal-Service header
   */
  @Post('internal/sms/send')
  @ApiOperation({ summary: '[Internal] Send SMS message' })
  @ApiResponse({ status: 200, description: 'SMS sent successfully' })
  async sendSmsInternal(
    @Body() body: { to: string; message: string },
    @Headers('x-internal-service') serviceName?: string,
  ) {
    // Basic service-to-service authentication check
    const allowedServices = ['user-service', 'alert-service', 'dispatcher-service'];
    if (serviceName && !allowedServices.includes(serviceName.toLowerCase())) {
      this.logger.warn('Unauthorized internal service call', { serviceName, to: body.to });
      throw new Error('Unauthorized internal service call');
    }

    try {
      await this.smsService.send({
        to: body.to,
        message: body.message,
      });

      return {
        success: true,
        message: 'SMS sent successfully',
      };
    } catch (error: any) {
      this.logger.error('Failed to send SMS (internal)', {
        to: body.to,
        error: error.message,
      });
      throw error;
    }
  }
}

