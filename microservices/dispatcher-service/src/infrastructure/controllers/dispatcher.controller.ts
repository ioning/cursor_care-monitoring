import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DispatcherService } from '../../application/services/dispatcher.service';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';

@ApiTags('dispatcher')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DispatcherController {
  constructor(private readonly dispatcherService: DispatcherService) {}

  @Get('calls')
  @ApiOperation({ summary: 'Get emergency calls' })
  @ApiResponse({ status: 200, description: 'Calls retrieved successfully' })
  async getCalls(@Query() query: any) {
    return this.dispatcherService.getCalls(query);
  }

  @Get('calls/:callId')
  @ApiOperation({ summary: 'Get call by ID' })
  @ApiResponse({ status: 200, description: 'Call retrieved successfully' })
  async getCall(@Param('callId') callId: string) {
    return this.dispatcherService.getCall(callId);
  }

  @Post('calls/:callId/assign')
  @ApiOperation({ summary: 'Assign call to dispatcher' })
  @ApiResponse({ status: 200, description: 'Call assigned successfully' })
  async assignCall(@Request() req, @Param('callId') callId: string) {
    return this.dispatcherService.assignCall(callId, req.user.id);
  }

  @Put('calls/:callId/status')
  @ApiOperation({ summary: 'Update call status' })
  @ApiResponse({ status: 200, description: 'Call status updated successfully' })
  async updateStatus(
    @Param('callId') callId: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.dispatcherService.updateCallStatus(callId, body.status, body.notes);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dispatcher statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats() {
    return this.dispatcherService.getStats();
  }
}

