import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { register } from '../../../../../shared/libs/metrics';

@ApiTags('metrics')
@Controller()
export class MetricsController {
  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  @ApiResponse({ status: 200, description: 'Prometheus metrics' })
  async metrics(@Res() res: Response) {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  }
}
