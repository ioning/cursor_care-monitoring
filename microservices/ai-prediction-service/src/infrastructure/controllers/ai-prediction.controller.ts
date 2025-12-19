import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AIPredictionService } from '../../application/services/ai-prediction.service';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';

@ApiTags('ai-predictions')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIPredictionController {
  constructor(private readonly aiService: AIPredictionService) {}

  @Get('wards/:wardId/predictions')
  @ApiOperation({ summary: 'Get predictions for ward' })
  @ApiResponse({ status: 200, description: 'Predictions retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by prediction type' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO 8601)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of results', type: Number })
  async getPredictions(
    @Param('wardId') wardId: string,
    @Query('type') type?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit?: number,
  ) {
    if (!wardId) {
      throw new BadRequestException('wardId is required');
    }

    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    if (fromDate && isNaN(fromDate.getTime())) {
      throw new BadRequestException('Invalid from date format');
    }

    if (toDate && isNaN(toDate.getTime())) {
      throw new BadRequestException('Invalid to date format');
    }

    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException('from date must be before to date');
    }

    if (limit && (limit < 1 || limit > 1000)) {
      throw new BadRequestException('limit must be between 1 and 1000');
    }

    const predictions = await this.aiService.getPredictionsForWard(wardId, {
      type,
      from: fromDate,
      to: toDate,
      limit,
    });

    return {
      success: true,
      data: predictions,
      count: predictions.length,
      message: 'Predictions retrieved successfully',
    };
  }

  @Get('wards/:wardId/predictions/stats')
  @ApiOperation({ summary: 'Get prediction statistics for ward' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to include in statistics',
    type: Number,
  })
  async getPredictionStats(
    @Param('wardId') wardId: string,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days?: number,
  ) {
    if (!wardId) {
      throw new BadRequestException('wardId is required');
    }

    if (days && (days < 1 || days > 365)) {
      throw new BadRequestException('days must be between 1 and 365');
    }

    const stats = await this.aiService.getPredictionStats(wardId, days);

    return {
      success: true,
      data: stats,
      message: 'Statistics retrieved successfully',
    };
  }

  @Get('predictions/:predictionId')
  @ApiOperation({ summary: 'Get prediction by ID' })
  @ApiResponse({ status: 200, description: 'Prediction retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Prediction not found' })
  async getPredictionById(@Param('predictionId') predictionId: string) {
    if (!predictionId) {
      throw new BadRequestException('predictionId is required');
    }

    const prediction = await this.aiService.getPredictionById(predictionId);

    if (!prediction) {
      throw new BadRequestException('Prediction not found');
    }

    return {
      success: true,
      data: prediction,
      message: 'Prediction retrieved successfully',
    };
  }
}


