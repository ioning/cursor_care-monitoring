import { Controller, Post, Get, Body, Param, Query, Request } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GatewayConfig } from '../config/gateway.config';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('telemetry')
@Controller('telemetry')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TelemetryController {
  constructor(
    private readonly httpService: HttpService,
    private readonly gatewayConfig: GatewayConfig,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Send telemetry data' })
  async create(@Request() req: any, @Body() createDto: any) {
    const telemetryServiceUrl = this.gatewayConfig.getTelemetryServiceUrl();
    const response = await firstValueFrom(
      this.httpService.post(`${telemetryServiceUrl}/telemetry`, createDto, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Get('wards/:wardId')
  @ApiOperation({ summary: 'Get telemetry data for ward' })
  async getWardTelemetry(
    @Request() req: any,
    @Param('wardId') wardId: string,
    @Query() query: any,
  ) {
    const telemetryServiceUrl = this.gatewayConfig.getTelemetryServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${telemetryServiceUrl}/telemetry/wards/${wardId}`, {
        params: query,
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Get('wards/:wardId/latest')
  @ApiOperation({ summary: 'Get latest telemetry data for ward' })
  async getLatest(@Request() req: any, @Param('wardId') wardId: string) {
    const telemetryServiceUrl = this.gatewayConfig.getTelemetryServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${telemetryServiceUrl}/telemetry/wards/${wardId}/latest`, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }
}

