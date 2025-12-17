import { Controller, Get, Put, Param, Query, Body, Request } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GatewayConfig } from '../config/gateway.config';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertController {
  constructor(
    private readonly httpService: HttpService,
    private readonly gatewayConfig: GatewayConfig,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all alerts for current user' })
  async getAlerts(@Request() req: any, @Query() query: any) {
    const alertServiceUrl = this.gatewayConfig.getAlertServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${alertServiceUrl}/alerts`, {
        params: query,
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Get(':alertId')
  @ApiOperation({ summary: 'Get alert by ID' })
  async getAlert(@Request() req: any, @Param('alertId') alertId: string) {
    const alertServiceUrl = this.gatewayConfig.getAlertServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${alertServiceUrl}/alerts/${alertId}`, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Put(':alertId/status')
  @ApiOperation({ summary: 'Update alert status' })
  async updateStatus(@Request() req: any, @Param('alertId') alertId: string, @Body() updateDto: any) {
    const alertServiceUrl = this.gatewayConfig.getAlertServiceUrl();
    const response = await firstValueFrom(
      this.httpService.put(`${alertServiceUrl}/alerts/${alertId}/status`, updateDto, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }
}

