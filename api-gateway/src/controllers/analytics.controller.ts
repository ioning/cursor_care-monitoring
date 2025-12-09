import { Controller, Get, Post, Param, Query, Body, Request } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GatewayConfig } from '../config/gateway.config';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(
    private readonly httpService: HttpService,
    private readonly gatewayConfig: GatewayConfig,
  ) {}

  @Get('wards/:wardId/health-report')
  @ApiOperation({ summary: 'Get health report for ward' })
  async getWardHealthReport(@Request() req, @Param('wardId') wardId: string, @Query('period') period: string) {
    const analyticsServiceUrl = this.gatewayConfig.getAnalyticsServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${analyticsServiceUrl}/analytics/wards/${wardId}/health-report`, {
        params: { period },
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Get('system/stats')
  @ApiOperation({ summary: 'Get system statistics' })
  async getSystemStats(@Request() req) {
    const analyticsServiceUrl = this.gatewayConfig.getAnalyticsServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${analyticsServiceUrl}/analytics/system/stats`, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Post('reports')
  @ApiOperation({ summary: 'Generate report' })
  async generateReport(@Request() req, @Body() body: any) {
    const analyticsServiceUrl = this.gatewayConfig.getAnalyticsServiceUrl();
    const response = await firstValueFrom(
      this.httpService.post(`${analyticsServiceUrl}/analytics/reports`, body, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }
}

