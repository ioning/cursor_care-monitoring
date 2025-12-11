import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request, Ip, Headers } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { VerifyEmailDto, ResendVerificationCodeDto } from '../dto/verify-email.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async register(@Body() registerDto: RegisterDto, @Ip() ip: string, @Headers('user-agent') userAgent?: string) {
    return this.authService.register(registerDto, { ipAddress: ip, userAgent });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Ip() ip: string, @Headers('user-agent') userAgent?: string) {
    return this.authService.login(loginDto, { ipAddress: ip, userAgent });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Ip() ip: string, @Headers('user-agent') userAgent?: string) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken, { ipAddress: ip, userAgent });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Request() req, @Ip() ip: string, @Headers('user-agent') userAgent?: string) {
    return this.authService.logout(req.user.id, { ipAddress: ip, userAgent });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'User information' })
  async getMe(@Request() req) {
    return this.authService.getCurrentUser(req.user.id);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with 4-digit code' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification code' })
  @ApiResponse({ status: 200, description: 'Verification code sent' })
  @ApiResponse({ status: 400, description: 'User not found or email already verified' })
  async resendVerificationCode(@Body() resendDto: ResendVerificationCodeDto) {
    return this.authService.resendVerificationCode(resendDto);
  }
}

