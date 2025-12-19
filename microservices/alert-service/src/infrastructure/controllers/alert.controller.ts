import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AlertService } from '../../application/services/alert.service';
import { UpdateAlertStatusDto } from '../dto/update-alert-status.dto';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';

@ApiTags('alerts')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Get()
  @ApiOperation({ summary: 'Get all alerts for current user' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  async getAlerts(
    @Request() req: any,
    @Query('wardId') wardId?: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.alertService.getAlerts(req.user.id, {
      wardId,
      status,
      severity,
      page,
      limit,
    });
  }

  // NOTE: keep this from colliding with /alerts/health
  @Get('id/:alertId')
  @ApiOperation({ summary: 'Get alert by ID' })
  @ApiResponse({ status: 200, description: 'Alert retrieved successfully' })
  async getAlert(@Request() req: any, @Param('alertId') alertId: string) {
    return this.alertService.getAlert(req.user.id, alertId);
  }

  @Put('id/:alertId/status')
  @ApiOperation({ summary: 'Update alert status' })
  @ApiResponse({ status: 200, description: 'Alert status updated successfully' })
  async updateStatus(
    @Request() req: any,
    @Param('alertId') alertId: string,
    @Body() updateStatusDto: UpdateAlertStatusDto,
  ) {
    return this.alertService.updateStatus(req.user.id, alertId, updateStatusDto);
  }
}

