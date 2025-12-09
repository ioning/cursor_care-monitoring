import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GatewayConfig } from '../config/gateway.config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly httpService: HttpService,
    private readonly gatewayConfig: GatewayConfig,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async register(@Body() registerDto: any) {
    const authServiceUrl = this.gatewayConfig.getAuthServiceUrl();
    const response = await firstValueFrom(
      this.httpService.post(`${authServiceUrl}/auth/register`, registerDto),
    );
    return response.data;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: any) {
    const authServiceUrl = this.gatewayConfig.getAuthServiceUrl();
    const response = await firstValueFrom(
      this.httpService.post(`${authServiceUrl}/auth/login`, loginDto),
    );
    return response.data;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  async refresh(@Body() refreshDto: { refreshToken: string }) {
    const authServiceUrl = this.gatewayConfig.getAuthServiceUrl();
    const response = await firstValueFrom(
      this.httpService.post(`${authServiceUrl}/auth/refresh`, refreshDto),
    );
    return response.data;
  }
}

