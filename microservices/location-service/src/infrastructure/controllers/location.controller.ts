import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  Headers,
  SetMetadata,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LocationService } from '../../application/services/location.service';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';
import { InternalOrJwtGuard } from '../guards/internal-or-jwt.guard';

@ApiTags('locations')
@Controller()
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('wards/:wardId')
  @ApiOperation({ summary: 'Record location for ward' })
  @ApiResponse({ status: 201, description: 'Location recorded successfully' })
  async recordLocation(
    @Request() req: any,
    @Param('wardId') wardId: string,
    @Body() body: { latitude: number; longitude: number; accuracy?: number; source: string; timestamp?: string },
    @Headers('x-internal-service') internalService?: string,
  ) {
    // Allow internal service calls without JWT (for telemetry-service, device-service, integration-service)
    const allowedServices = ['telemetry-service', 'device-service', 'integration-service'];
    const isInternalCall = internalService && allowedServices.includes(internalService.toLowerCase());

    // Only require JWT for non-internal calls
    if (!isInternalCall) {
      // This will be handled by a guard if needed, but for now we allow both
    }

    await this.locationService.recordLocation({
      wardId,
      latitude: body.latitude,
      longitude: body.longitude,
      accuracy: body.accuracy,
      source: body.source,
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      organizationId: isInternalCall ? undefined : req.user?.organizationId,
    });
    return {
      success: true,
      message: 'Location recorded successfully',
    };
  }

  @Get('wards/:wardId/latest')
  @ApiOperation({ summary: 'Get latest location for ward' })
  @ApiResponse({ status: 200, description: 'Location retrieved successfully' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getLatestLocation(@Request() req: any, @Param('wardId') wardId: string) {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    return this.locationService.getLatestLocation(wardId, userId, userRole);
  }

  @Get('wards/:wardId/history')
  @ApiOperation({ summary: 'Get location history for ward' })
  @ApiResponse({ status: 200, description: 'Location history retrieved successfully' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getLocationHistory(@Request() req: any, @Param('wardId') wardId: string, @Query() query: any) {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    return this.locationService.getLocationHistory(wardId, query, userId, userRole);
  }

  @Post('geofences')
  @ApiOperation({ summary: 'Create geofence' })
  @ApiResponse({ status: 201, description: 'Geofence created successfully' })
  async createGeofence(@Body() body: any) {
    return this.locationService.createGeofence(body.wardId, body);
  }

  @Get('geofences')
  @ApiOperation({ summary: 'Get geofences for ward' })
  @ApiResponse({ status: 200, description: 'Geofences retrieved successfully' })
  async getGeofences(@Query('wardId') wardId: string, @Query('enabled') enabled?: string) {
    const enabledBool = enabled === undefined ? undefined : enabled === 'true';
    return this.locationService.getGeofences(wardId, { enabled: enabledBool });
  }

  @Patch('geofences/:geofenceId')
  @ApiOperation({ summary: 'Update geofence (enable/disable, rename)' })
  @ApiResponse({ status: 200, description: 'Geofence updated successfully' })
  async updateGeofence(@Param('geofenceId') geofenceId: string, @Body() body: any) {
    return this.locationService.updateGeofence(geofenceId, body);
  }

  @Delete('geofences/:geofenceId')
  @ApiOperation({ summary: 'Delete geofence' })
  @ApiResponse({ status: 200, description: 'Geofence deleted successfully' })
  async deleteGeofence(@Param('geofenceId') geofenceId: string) {
    return this.locationService.deleteGeofence(geofenceId);
  }

  @Get('geocode/reverse')
  @ApiOperation({ summary: 'Reverse geocode: convert coordinates to address' })
  @ApiResponse({ status: 200, description: 'Address retrieved successfully' })
  async reverseGeocode(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
  ) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return {
        success: false,
        error: 'Invalid coordinates. lat and lon must be valid numbers.',
      };
    }

    return this.locationService.reverseGeocode(latitude, longitude);
  }

  @Get('geocode')
  @ApiOperation({ summary: 'Geocode: convert address to coordinates' })
  @ApiResponse({ status: 200, description: 'Coordinates retrieved successfully' })
  async geocode(@Query('address') address: string) {
    if (!address || address.trim().length === 0) {
      return {
        success: false,
        error: 'Address parameter is required.',
      };
    }

    return this.locationService.geocode(address.trim());
  }
}

