import { Controller, Post, Body, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TelemetryService } from '../../application/services/telemetry.service';
import { CreateTelemetryDto } from '../dto/create-telemetry.dto';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';

@ApiTags('telemetry')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post()
  @ApiOperation({ summary: 'Send telemetry data' })
  @ApiResponse({ status: 201, description: 'Telemetry data saved successfully' })
  async create(@Body() createTelemetryDto: CreateTelemetryDto) {
    return this.telemetryService.create(createTelemetryDto);
  }

  @Get('wards/:wardId')
  @ApiOperation({ summary: 'Get telemetry data for ward' })
  @ApiResponse({ status: 200, description: 'Telemetry data retrieved successfully' })
  async getWardTelemetry(
    @Param('wardId') wardId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('metricType') metricType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.telemetryService.getByWardId(wardId, { from, to, metricType, page, limit });
  }

  @Get('wards/:wardId/latest')
  @ApiOperation({ summary: 'Get latest telemetry data for ward' })
  @ApiResponse({ status: 200, description: 'Latest telemetry data retrieved successfully' })
  async getLatest(@Param('wardId') wardId: string) {
    return this.telemetryService.getLatest(wardId);
  }
}

