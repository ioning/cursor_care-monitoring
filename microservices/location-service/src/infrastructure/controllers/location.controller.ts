import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LocationService } from '../../application/services/location.service';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';

@ApiTags('locations')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('wards/:wardId')
  @ApiOperation({ summary: 'Record location for ward' })
  @ApiResponse({ status: 201, description: 'Location recorded successfully' })
  async recordLocation(
    @Request() req,
    @Param('wardId') wardId: string,
    @Body() body: { latitude: number; longitude: number; accuracy?: number; source: string },
  ) {
    await this.locationService.recordLocation({
      wardId,
      ...body,
      organizationId: req.user?.organizationId,
    });
    return {
      success: true,
      message: 'Location recorded successfully',
    };
  }

  @Get('wards/:wardId/latest')
  @ApiOperation({ summary: 'Get latest location for ward' })
  @ApiResponse({ status: 200, description: 'Location retrieved successfully' })
  async getLatestLocation(@Param('wardId') wardId: string) {
    return this.locationService.getLatestLocation(wardId);
  }

  @Get('wards/:wardId/history')
  @ApiOperation({ summary: 'Get location history for ward' })
  @ApiResponse({ status: 200, description: 'Location history retrieved successfully' })
  async getLocationHistory(@Param('wardId') wardId: string, @Query() query: any) {
    return this.locationService.getLocationHistory(wardId, query);
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
  async getGeofences(@Query('wardId') wardId: string) {
    return this.locationService.getGeofences(wardId);
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

