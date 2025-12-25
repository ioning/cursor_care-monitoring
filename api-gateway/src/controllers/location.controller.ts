import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GatewayConfig } from '../config/gateway.config';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

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
    try {
      const locationServiceUrl = this.gatewayConfig.getLocationServiceUrl();
      const response = await firstValueFrom(
        this.httpService.post(`${locationServiceUrl}/locations/wards/${wardId}`, body, {
          headers: { Authorization: req.headers.authorization },
        }),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  @Get('wards/:wardId/latest')
  @ApiOperation({ summary: 'Get latest location for ward' })
  async getLatestLocation(@Request() req: any, @Param('wardId') wardId: string) {
    try {
      const locationServiceUrl = this.gatewayConfig.getLocationServiceUrl();
      const response = await firstValueFrom(
        this.httpService.get(`${locationServiceUrl}/locations/wards/${wardId}/latest`, {
          headers: { Authorization: req.headers.authorization },
        }),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  @Get('wards/:wardId/history')
  @ApiOperation({ summary: 'Get location history for ward' })
  async getLocationHistory(@Request() req: any, @Param('wardId') wardId: string, @Query() query: any) {
    try {
      const locationServiceUrl = this.gatewayConfig.getLocationServiceUrl();
      const response = await firstValueFrom(
        this.httpService.get(`${locationServiceUrl}/locations/wards/${wardId}/history`, {
          params: query,
          headers: { Authorization: req.headers.authorization },
        }),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  @Get('geofences')
  @ApiOperation({ summary: 'Get geofences for ward' })
  async getGeofences(@Request() req: any, @Query('wardId') wardId: string, @Query('enabled') enabled?: string) {
    try {
      const locationServiceUrl = this.gatewayConfig.getLocationServiceUrl();
      const response = await firstValueFrom(
        this.httpService.get(`${locationServiceUrl}/locations/geofences`, {
          params: { wardId, ...(enabled !== undefined ? { enabled } : {}) },
          headers: { Authorization: req.headers.authorization },
        }),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  @Post('geofences')
  @ApiOperation({ summary: 'Create geofence' })
  async createGeofence(@Request() req: any, @Body() body: any) {
    try {
      const locationServiceUrl = this.gatewayConfig.getLocationServiceUrl();
      const response = await firstValueFrom(
        this.httpService.post(`${locationServiceUrl}/locations/geofences`, body, {
          headers: { Authorization: req.headers.authorization },
        }),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  @Patch('geofences/:geofenceId')
  @ApiOperation({ summary: 'Update geofence (enable/disable, rename)' })
  async updateGeofence(@Request() req: any, @Param('geofenceId') geofenceId: string, @Body() body: any) {
    try {
      const locationServiceUrl = this.gatewayConfig.getLocationServiceUrl();
      const response = await firstValueFrom(
        this.httpService.patch(`${locationServiceUrl}/locations/geofences/${geofenceId}`, body, {
          headers: { Authorization: req.headers.authorization },
        }),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  @Delete('geofences/:geofenceId')
  @ApiOperation({ summary: 'Delete geofence' })
  async deleteGeofence(@Request() req: any, @Param('geofenceId') geofenceId: string) {
    try {
      const locationServiceUrl = this.gatewayConfig.getLocationServiceUrl();
      const response = await firstValueFrom(
        this.httpService.delete(`${locationServiceUrl}/locations/geofences/${geofenceId}`, {
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


