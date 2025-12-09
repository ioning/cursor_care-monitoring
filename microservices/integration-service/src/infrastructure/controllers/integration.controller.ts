import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationService } from '../../application/services/integration.service';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';

@ApiTags('integrations')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get('notifications')
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
}

