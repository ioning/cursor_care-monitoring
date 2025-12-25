import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GatewayConfig } from '../config/gateway.config';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

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
  async register(@Request() req: any, @Body() registerDto: any) {
    try {
      const deviceServiceUrl = this.gatewayConfig.getDeviceServiceUrl();
      const response = await firstValueFrom(
        this.httpService.post(`${deviceServiceUrl}/devices/register`, registerDto, {
          headers: { Authorization: req.headers.authorization },
        }),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices for current user' })
  async getDevices(@Request() req: any, @Query('wardId') wardId?: string) {
    try {
      const deviceServiceUrl = this.gatewayConfig.getDeviceServiceUrl();
      const response = await firstValueFrom(
        this.httpService.get(`${deviceServiceUrl}/devices`, {
          params: { wardId },
          headers: { Authorization: req.headers.authorization },
        }),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  @Get(':deviceId')
  @ApiOperation({ summary: 'Get device by ID' })
  async getDevice(@Request() req: any, @Param('deviceId') deviceId: string) {
    try {
      const deviceServiceUrl = this.gatewayConfig.getDeviceServiceUrl();
      const response = await firstValueFrom(
        this.httpService.get(`${deviceServiceUrl}/devices/${deviceId}`, {
          headers: { Authorization: req.headers.authorization },
        }),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  @Put(':deviceId')
  @ApiOperation({ summary: 'Update device' })
  async updateDevice(@Request() req: any, @Param('deviceId') deviceId: string, @Body() updateDto: any) {
    try {
      const deviceServiceUrl = this.gatewayConfig.getDeviceServiceUrl();
      const response = await firstValueFrom(
        this.httpService.put(`${deviceServiceUrl}/devices/${deviceId}`, updateDto, {
          headers: { Authorization: req.headers.authorization },
        }),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  @Post(':deviceId/link')
  @ApiOperation({ summary: 'Link device to ward' })
  async linkDevice(@Request() req: any, @Param('deviceId') deviceId: string, @Body() linkDto: any) {
    try {
      const deviceServiceUrl = this.gatewayConfig.getDeviceServiceUrl();
      const response = await firstValueFrom(
        this.httpService.post(`${deviceServiceUrl}/devices/id/${deviceId}/link`, linkDto, {
          headers: { Authorization: req.headers.authorization },
        }),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  @Delete(':deviceId')
  @ApiOperation({ summary: 'Delete device' })
  async deleteDevice(@Request() req: any, @Param('deviceId') deviceId: string) {
    try {
      const deviceServiceUrl = this.gatewayConfig.getDeviceServiceUrl();
      const response = await firstValueFrom(
        this.httpService.delete(`${deviceServiceUrl}/devices/${deviceId}`, {
          headers: { Authorization: req.headers.authorization },
        }),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  private proxyHttpError(error: any): HttpException {
    const status = error?.response?.status;
    const data = error?.response?.data;
    if (typeof status === 'number') {
      return new HttpException(data ?? { message: error.message }, status);
    }
    return new HttpException(
      { message: error?.message || 'Upstream service request failed' },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

