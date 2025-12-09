import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GatewayConfig } from '../config/gateway.config';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('devices')
@Controller('devices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeviceController {
  constructor(
    private readonly httpService: HttpService,
    private readonly gatewayConfig: GatewayConfig,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new device' })
  async register(@Request() req, @Body() registerDto: any) {
    const deviceServiceUrl = this.gatewayConfig.getDeviceServiceUrl();
    const response = await firstValueFrom(
      this.httpService.post(`${deviceServiceUrl}/devices/register`, registerDto, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices for current user' })
  async getDevices(@Request() req, @Query('wardId') wardId?: string) {
    const deviceServiceUrl = this.gatewayConfig.getDeviceServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${deviceServiceUrl}/devices`, {
        params: { wardId },
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Get(':deviceId')
  @ApiOperation({ summary: 'Get device by ID' })
  async getDevice(@Request() req, @Param('deviceId') deviceId: string) {
    const deviceServiceUrl = this.gatewayConfig.getDeviceServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${deviceServiceUrl}/devices/${deviceId}`, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Put(':deviceId')
  @ApiOperation({ summary: 'Update device' })
  async updateDevice(@Request() req, @Param('deviceId') deviceId: string, @Body() updateDto: any) {
    const deviceServiceUrl = this.gatewayConfig.getDeviceServiceUrl();
    const response = await firstValueFrom(
      this.httpService.put(`${deviceServiceUrl}/devices/${deviceId}`, updateDto, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Delete(':deviceId')
  @ApiOperation({ summary: 'Delete device' })
  async deleteDevice(@Request() req, @Param('deviceId') deviceId: string) {
    const deviceServiceUrl = this.gatewayConfig.getDeviceServiceUrl();
    const response = await firstValueFrom(
      this.httpService.delete(`${deviceServiceUrl}/devices/${deviceId}`, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }
}

