import { Controller, Post, Body, HttpCode, HttpStatus, HttpException, Get, UseGuards, Request } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GatewayConfig } from '../config/gateway.config';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

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
    try {
      const authServiceUrl = this.gatewayConfig.getAuthServiceUrl();
      const response = await firstValueFrom(
        this.httpService.post(`${authServiceUrl}/auth/register`, registerDto),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: any) {
    try {
      const authServiceUrl = this.gatewayConfig.getAuthServiceUrl();
      const response = await firstValueFrom(
        this.httpService.post(`${authServiceUrl}/auth/login`, loginDto),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  async refresh(@Body() refreshDto: { refreshToken: string }) {
    try {
      const authServiceUrl = this.gatewayConfig.getAuthServiceUrl();
      const response = await firstValueFrom(
        this.httpService.post(`${authServiceUrl}/auth/refresh`, refreshDto),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'User information' })
  async me(@Request() req: any) {
    try {
      const authServiceUrl = this.gatewayConfig.getAuthServiceUrl();
      const response = await firstValueFrom(
        this.httpService.get(`${authServiceUrl}/auth/me`, {
          headers: { Authorization: req.headers.authorization },
        }),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Request() req: any) {
    try {
      const authServiceUrl = this.gatewayConfig.getAuthServiceUrl();
      const response = await firstValueFrom(
        this.httpService.post(
          `${authServiceUrl}/auth/logout`,
          {},
          { headers: { Authorization: req.headers.authorization } },
        ),
      );
      return response.data;
    } catch (error: any) {
      throw this.proxyHttpError(error);
    }
  }

  private proxyHttpError(error: any): HttpException {
    // Axios error shape: error.response = { status, data }
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

