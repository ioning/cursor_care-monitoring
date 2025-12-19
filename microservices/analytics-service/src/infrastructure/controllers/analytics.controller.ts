import { Controller, Get, Post, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from '../../application/services/analytics.service';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';

@ApiTags('analytics')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('wards/:wardId/health-report')
  @ApiOperation({ summary: 'Get health report for ward' })
  @ApiResponse({ status: 200, description: 'Health report retrieved successfully' })
  async getWardHealthReport(@Param('wardId') wardId: string, @Query('period') period: string) {
    return this.analyticsService.getWardHealthReport(wardId, period || '7d');
  }

  @Get('system/stats')
  @ApiOperation({ summary: 'Get system statistics' })
  @ApiResponse({ status: 200, description: 'System stats retrieved successfully' })
  async getSystemStats() {
    return this.analyticsService.getSystemStats();
  }

  @Post('reports')
  @ApiOperation({ summary: 'Generate report' })
  @ApiResponse({ status: 201, description: 'Report generation started' })
  async generateReport(@Request() req: any, @Body() body: any) {
    return this.analyticsService.generateReport(req.user.id, body);
  }

  @Post('reports/comparative')
  @ApiOperation({ summary: 'Generate comparative report' })
  @ApiResponse({ status: 201, description: 'Comparative report generation started' })
  async generateComparativeReport(@Request() req: any, @Body() body: any) {
    return this.analyticsService.generateComparativeReport(req.user.id, body);
  }

  @Post('reports/schedule')
  @ApiOperation({ summary: 'Schedule report generation' })
  @ApiResponse({ status: 201, description: 'Report scheduled successfully' })
  async scheduleReport(@Request() req: any, @Body() body: any) {
    return this.analyticsService.scheduleReport(req.user.id, body);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get user reports' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async getUserReports(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.analyticsService.getUserReports(
      req.user.id,
      limit ? parseInt(limit.toString()) : 50,
      offset ? parseInt(offset.toString()) : 0,
    );
  }

  @Post('reports/:reportId/export')
  @ApiOperation({ summary: 'Export report to format' })
  @ApiResponse({ status: 200, description: 'Report exported successfully' })
  async exportReport(
    @Param('reportId') reportId: string,
    @Body() body: { format: 'pdf' | 'csv' | 'json' | 'xlsx' | 'hl7_fhir' },
  ) {
    return this.analyticsService.exportReport(reportId, body.format);
  }

  @Get('reports/:reportId/files')
  @ApiOperation({ summary: 'Get report files' })
  @ApiResponse({ status: 200, description: 'Report files retrieved successfully' })
  async getReportFiles(@Param('reportId') reportId: string) {
    return this.analyticsService.getReportFiles(reportId);
  }
}

