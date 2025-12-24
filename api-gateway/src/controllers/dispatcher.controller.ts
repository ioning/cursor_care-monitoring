import { Controller, Get, Post, Put, Param, Query, Body, Request } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GatewayConfig } from '../config/gateway.config';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('dispatcher')
@Controller('dispatcher')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DispatcherController {
  constructor(
    private readonly httpService: HttpService,
    private readonly gatewayConfig: GatewayConfig,
  ) {}

  @Get('calls')
  @ApiOperation({ summary: 'Get emergency calls' })
  async getCalls(@Request() req: any, @Query() query: any) {
    const dispatcherServiceUrl = this.gatewayConfig.getDispatcherServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${dispatcherServiceUrl}/dispatcher/calls`, {
        params: query,
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Get('calls/:callId')
  @ApiOperation({ summary: 'Get call by ID' })
  async getCall(@Request() req: any, @Param('callId') callId: string) {
    const dispatcherServiceUrl = this.gatewayConfig.getDispatcherServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${dispatcherServiceUrl}/dispatcher/calls/${callId}`, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Post('calls/:callId/assign')
  @ApiOperation({ summary: 'Assign call to dispatcher' })
  async assignCall(@Request() req: any, @Param('callId') callId: string) {
    const dispatcherServiceUrl = this.gatewayConfig.getDispatcherServiceUrl();
    const response = await firstValueFrom(
      this.httpService.post(`${dispatcherServiceUrl}/dispatcher/calls/${callId}/assign`, {}, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Put('calls/:callId/status')
  @ApiOperation({ summary: 'Update call status' })
  async updateStatus(@Request() req: any, @Param('callId') callId: string, @Body() body: any) {
    const dispatcherServiceUrl = this.gatewayConfig.getDispatcherServiceUrl();
    const response = await firstValueFrom(
      this.httpService.put(`${dispatcherServiceUrl}/dispatcher/calls/${callId}/status`, body, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dispatcher statistics' })
  async getStats(@Request() req: any) {
    const dispatcherServiceUrl = this.gatewayConfig.getDispatcherServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${dispatcherServiceUrl}/dispatcher/stats`, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }
}

