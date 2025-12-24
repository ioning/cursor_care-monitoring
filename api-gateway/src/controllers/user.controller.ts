import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GatewayConfig } from '../config/gateway.config';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly httpService: HttpService,
    private readonly gatewayConfig: GatewayConfig,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Request() req: any) {
    const userServiceUrl = this.gatewayConfig.getUserServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${userServiceUrl}/users/me`, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@Request() req: any, @Body() updateDto: any) {
    const userServiceUrl = this.gatewayConfig.getUserServiceUrl();
    const response = await firstValueFrom(
      this.httpService.put(`${userServiceUrl}/users/me`, updateDto, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Get('wards')
  @ApiOperation({ summary: 'Get all wards for current guardian' })
  async getWards(@Request() req: any) {
    const userServiceUrl = this.gatewayConfig.getUserServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${userServiceUrl}/users/wards`, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Post('wards')
  @ApiOperation({ summary: 'Create new ward' })
  async createWard(@Request() req: any, @Body() createWardDto: any) {
    const userServiceUrl = this.gatewayConfig.getUserServiceUrl();
    const response = await firstValueFrom(
      this.httpService.post(`${userServiceUrl}/users/wards`, createWardDto, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Get('wards/:wardId')
  @ApiOperation({ summary: 'Get ward by ID' })
  async getWard(@Request() req: any, @Param('wardId') wardId: string) {
    const userServiceUrl = this.gatewayConfig.getUserServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${userServiceUrl}/users/wards/${wardId}`, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Put('wards/:wardId')
  @ApiOperation({ summary: 'Update ward' })
  async updateWard(@Request() req: any, @Param('wardId') wardId: string, @Body() updateDto: any) {
    const userServiceUrl = this.gatewayConfig.getUserServiceUrl();
    const response = await firstValueFrom(
      this.httpService.put(`${userServiceUrl}/users/wards/${wardId}`, updateDto, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Delete('wards/:wardId')
  @ApiOperation({ summary: 'Delete ward' })
  async deleteWard(@Request() req: any, @Param('wardId') wardId: string) {
    const userServiceUrl = this.gatewayConfig.getUserServiceUrl();
    const response = await firstValueFrom(
      this.httpService.delete(`${userServiceUrl}/users/wards/${wardId}`, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Post('wards/:wardId/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload ward avatar' })
  @ApiConsumes('multipart/form-data')
  async uploadAvatar(
    @Request() req: any,
    @Param('wardId') wardId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const userServiceUrl = this.gatewayConfig.getUserServiceUrl();
    
    // Create FormData for forwarding
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('avatar', file.buffer, {
      filename: file.originalname || 'avatar.jpg',
      contentType: file.mimetype || 'image/jpeg',
    });

    const response = await firstValueFrom(
      this.httpService.post(
        `${userServiceUrl}/users/wards/${wardId}/avatar`,
        formData,
        {
          headers: {
            Authorization: req.headers.authorization,
            ...formData.getHeaders(),
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      ),
    );
    return response.data;
  }
}


