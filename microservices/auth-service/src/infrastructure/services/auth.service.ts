import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';
import { EmailVerificationRepository } from '../repositories/email-verification.repository';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { EmailService } from './email.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyEmailDto, ResendVerificationCodeDto } from '../dto/verify-email.dto';
import { createLogger } from '../../../../../shared/libs/logger';
import { createAuditLogger } from '../../../../../shared/libs/audit-logger';

@Injectable()
export class AuthService {
  private readonly logger = createLogger({ serviceName: 'auth-service' });
  private readonly auditLogger = createAuditLogger('auth-service');

  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly emailVerificationRepository: EmailVerificationRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto, context?: { ipAddress?: string; userAgent?: string }) {
    const existingUser = await this.userRepository.findByEmail(registerDto.email);
    if (existingUser) {
      this.auditLogger.logAuth('login_failed', {
        email: registerDto.email,
        reason: 'User already exists',
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      });
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await this.passwordService.hash(registerDto.password);
    const user = await this.userRepository.create({
      email: registerDto.email,
      passwordHash,
      fullName: registerDto.fullName,
      phone: registerDto.phone,
      role: registerDto.role,
      emailVerified: false,
    });

    // Генерируем 4-значный код
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

    // Сохраняем код
    await this.emailVerificationRepository.createCode(registerDto.email, code, expiresAt, user.id);

    // Отправляем код на email
    try {
      await this.emailService.sendVerificationCode(registerDto.email, code, registerDto.fullName);
    } catch (error: any) {
      this.logger.error('Failed to send verification email during registration', {
        error: error.message,
        email: registerDto.email,
      });
      // Не прерываем регистрацию, но логируем ошибку
    }

    this.logger.info(`User registered: ${user.id}`, { userId: user.id, email: user.email });
    
    // Audit log
    this.auditLogger.logAuth('register', {
      userId: user.id,
      email: user.email,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          emailVerified: false,
        },
      },
      message: 'Registration successful. Please check your email for verification code.',
      requiresEmailVerification: true,
    };
  }

  /**
   * Internal method for creating ward user account
   * Skips email verification and uses provided ID
   */
  async registerInternal(data: {
    id: string;
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role: string;
    organizationId?: string;
    skipEmailVerification?: boolean;
  }) {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Проверяем, не существует ли пользователь с таким ID
    const existingUserById = await this.userRepository.findById(data.id);
    if (existingUserById) {
      throw new ConflictException('User with this ID already exists');
    }

    const passwordHash = await this.passwordService.hash(data.password);
    const user = await this.userRepository.create({
      id: data.id, // Используем переданный ID
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      phone: data.phone,
      role: data.role,
      organizationId: data.organizationId,
      emailVerified: data.skipEmailVerification ? true : false, // Пропускаем верификацию если нужно
    });

    this.logger.info(`Ward user created internally: ${user.id}`, {
      userId: user.id,
      email: user.email,
      phone: user.phone,
    });

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      },
      message: 'Ward user created successfully',
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, code } = verifyEmailDto;

    // Проверяем код
    const verificationCode = await this.emailVerificationRepository.findValidCode(email, code);
    if (!verificationCode) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Находим пользователя
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Помечаем код как использованный
    await this.emailVerificationRepository.markConsumed(verificationCode.id);

    // Устанавливаем email как подтверждённый
    await this.userRepository.setEmailVerifiedById(user.id);

    // Генерируем токены
    const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);
    await this.sessionRepository.create({
      userId: user.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      deviceInfo: {},
    });

    this.logger.info(`Email verified: ${user.id}`, { userId: user.id, email: user.email });

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          emailVerified: true,
        },
        tokens,
      },
      message: 'Email verified successfully',
    };
  }

  async resendVerificationCode(resendDto: ResendVerificationCodeDto) {
    const { email } = resendDto;

    // Проверяем существование пользователя
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Проверяем, не подтверждён ли уже email
    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Генерируем новый код
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

    // Сохраняем код
    await this.emailVerificationRepository.createCode(email, code, expiresAt, user.id);

    // Отправляем код
    await this.emailService.sendVerificationCode(email, code, user.fullName);

    this.logger.info(`Verification code resent: ${email}`);

    return {
      success: true,
      message: 'Verification code sent to your email',
    };
  }

  async login(loginDto: LoginDto, context?: { ipAddress?: string; userAgent?: string }) {
    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user) {
      this.auditLogger.logAuth('login_failed', {
        email: loginDto.email,
        reason: 'User not found',
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordService.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      this.auditLogger.logAuth('login_failed', {
        userId: user.id,
        email: user.email,
        reason: 'Invalid password',
        ipAddress: context?.ipAddress,
        userAgent: context?.userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Проверяем, подтверждён ли email (опционально, можно разрешить вход без подтверждения)
    // if (!user.emailVerified) {
    //   throw new UnauthorizedException('Please verify your email before logging in');
    // }

    const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);
    await this.sessionRepository.create({
      userId: user.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      deviceInfo: loginDto.deviceInfo || {},
    });

    await this.userRepository.updateLastLogin(user.id);

    this.logger.info(`User logged in: ${user.id}`, { userId: user.id, email: user.email });
    
    // Audit log
    this.auditLogger.logAuth('login', {
      userId: user.id,
      email: user.email,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        tokens,
      },
    };
  }

  async refreshToken(refreshToken: string, context?: { ipAddress?: string; userAgent?: string }) {
    const session = await this.sessionRepository.findByRefreshToken(refreshToken);
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepository.findById(session.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.tokenService.generateTokens(user.id, user.email, user.role);
    await this.sessionRepository.updateTokens(session.id, tokens.accessToken, tokens.refreshToken);

    // Audit log
    this.auditLogger.logAuth('token_refresh', {
      userId: user.id,
      email: user.email,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return {
      success: true,
      data: tokens,
    };
  }

  async logout(userId: string, context?: { ipAddress?: string; userAgent?: string }) {
    await this.sessionRepository.deleteByUserId(userId);
    this.logger.info(`User logged out: ${userId}`, { userId });
    
    // Audit log
    this.auditLogger.logAuth('logout', {
      userId,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return {
      success: true,
      message: 'Logout successful',
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.passwordService.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}

