import { Controller, Post, Get, Body, Param, Query, Request, HttpException, HttpStatus } from '@nestjs/common';
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
    try {
      const telemetryServiceUrl = this.gatewayConfig.getTelemetryServiceUrl();
      
      // Transform data format if needed (for mobile app compatibility)
      // Mobile app sends: { deviceId, metricType, value, unit, timestamp }
      // Telemetry service expects: { deviceId, metrics: [{ type, value, unit, timestamp }], location? }
      const transformedDto = this.transformTelemetryData(createDto, req.user);
      
      const response = await firstValueFrom(
        this.httpService.post(`${telemetryServiceUrl}/telemetry`, transformedDto, {
          headers: { Authorization: req.headers.authorization },
        }),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  /**
   * Transform telemetry data from mobile app format to service format
   * Mobile app format: { deviceId?, wardId?, metricType, value, unit, timestamp }
   * Service format: { deviceId, metrics: [{ type, value, unit, timestamp }], location? }
   */
  private transformTelemetryData(data: any, user?: any): any {
    // If data already has 'metrics' array, it's already in correct format
    if (data.metrics && Array.isArray(data.metrics)) {
      return data;
    }

    // Transform from mobile app format (single metric) to service format (array of metrics)
    if (data.metricType || data.type) {
      const metricType = data.metricType || data.type;
      const transformed = {
        deviceId: data.deviceId || user?.deviceId,
        metrics: [
          {
            type: metricType,
            value: data.value,
            unit: data.unit,
            qualityScore: data.qualityScore,
            timestamp: data.timestamp || new Date().toISOString(),
          },
        ],
      };

      // Add location if provided
      if (data.location) {
        transformed.location = data.location;
      } else if (data.latitude && data.longitude) {
        transformed.location = {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          source: data.source || 'mobile_app',
        };
      }

      return transformed;
    }

    // If format is unknown, return as-is (will be validated by service)
    return data;
  }

  @Get('wards/:wardId')
  @ApiOperation({ summary: 'Get telemetry data for ward' })
  async getWardTelemetry(
    @Request() req: any,
    @Param('wardId') wardId: string,
    @Query() query: any,
  ) {
    try {
      const telemetryServiceUrl = this.gatewayConfig.getTelemetryServiceUrl();
      const response = await firstValueFrom(
        this.httpService.get(`${telemetryServiceUrl}/telemetry/wards/${wardId}`, {
          params: query,
          headers: { Authorization: req.headers.authorization },
        }),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  @Get('wards/:wardId/latest')
  @ApiOperation({ summary: 'Get latest telemetry data for ward' })
  async getLatest(@Request() req: any, @Param('wardId') wardId: string) {
    try {
      const telemetryServiceUrl = this.gatewayConfig.getTelemetryServiceUrl();
      const response = await firstValueFrom(
        this.httpService.get(`${telemetryServiceUrl}/telemetry/wards/${wardId}/latest`, {
          headers: { Authorization: req.headers.authorization },
        }),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  private proxyHttpError(error: any): HttpException {
    const status = error?.response?.status;
    const data = error?.response?.data;
    if (typeof status === 'number') {
      return new HttpException(data ?? { message: error.message }, status);
    }
    return new HttpException(
      { message: error?.message || 'Upstream service request failed' },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

