import { Controller, Post, Body, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TelemetryService } from '../../application/services/telemetry.service';
import { CreateTelemetryDto } from '../dto/create-telemetry.dto';
import { JwtOrInternalGuard } from '../guards/jwt-or-internal.guard';
import { createLogger } from '../../../../../shared/libs/logger';

@ApiTags('telemetry')
@Controller()
@UseGuards(JwtOrInternalGuard)
@ApiBearerAuth()
export class TelemetryController {
  private readonly logger = createLogger({ serviceName: 'telemetry-service' });
  
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
    @Request() req: any,
    @Param('wardId') wardId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('metricType') metricType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    this.logger.info(`getWardTelemetry: req.user=${JSON.stringify(req.user)}, userId=${userId}, userRole=${userRole}, wardId=${wardId}`);
    return this.telemetryService.getByWardId(wardId, { from, to, metricType, page, limit }, userId, userRole);
  }

  @Get('wards/:wardId/latest')
  @ApiOperation({ summary: 'Get latest telemetry data for ward' })
  @ApiResponse({ status: 200, description: 'Latest telemetry data retrieved successfully' })
  async getLatest(@Request() req: any, @Param('wardId') wardId: string) {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    this.logger.info(`getLatest: req.user=${JSON.stringify(req.user)}, userId=${userId}, userRole=${userRole}, wardId=${wardId}`);
    return this.telemetryService.getLatest(wardId, userId, userRole);
  }
}

