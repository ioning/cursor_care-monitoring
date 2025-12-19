import { Controller, Get, Post, Body, Param, Query, Request } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GatewayConfig } from '../config/gateway.config';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';

@ApiTags('locations')
@Controller('locations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LocationController {
  constructor(
    private readonly httpService: HttpService,
    private readonly gatewayConfig: GatewayConfig,
  ) {}

  @Post('wards/:wardId')
  @ApiOperation({ summary: 'Record location for ward' })
  async recordLocation(
    @Request() req: any,
    @Param('wardId') wardId: string,
    @Body() body: any,
  ) {
    const locationServiceUrl = this.gatewayConfig.getLocationServiceUrl();
    const response = await firstValueFrom(
      this.httpService.post(`${locationServiceUrl}/locations/wards/${wardId}`, body, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Get('wards/:wardId/latest')
  @ApiOperation({ summary: 'Get latest location for ward' })
  async getLatestLocation(@Request() req: any, @Param('wardId') wardId: string) {
    const locationServiceUrl = this.gatewayConfig.getLocationServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${locationServiceUrl}/locations/wards/${wardId}/latest`, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Get('wards/:wardId/history')
  @ApiOperation({ summary: 'Get location history for ward' })
  async getLocationHistory(@Request() req: any, @Param('wardId') wardId: string, @Query() query: any) {
    const locationServiceUrl = this.gatewayConfig.getLocationServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${locationServiceUrl}/locations/wards/${wardId}/history`, {
        params: query,
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Get('geofences')
  @ApiOperation({ summary: 'Get geofences for ward' })
  async getGeofences(@Request() req: any, @Query('wardId') wardId: string) {
    const locationServiceUrl = this.gatewayConfig.getLocationServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${locationServiceUrl}/locations/geofences`, {
        params: { wardId },
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Post('geofences')
  @ApiOperation({ summary: 'Create geofence' })
  async createGeofence(@Request() req: any, @Body() body: any) {
    const locationServiceUrl = this.gatewayConfig.getLocationServiceUrl();
    const response = await firstValueFrom(
      this.httpService.post(`${locationServiceUrl}/locations/geofences`, body, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }
}


