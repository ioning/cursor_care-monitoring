import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { InternalController } from './infrastructure/controllers/internal.controller';
import { HealthController } from './infrastructure/controllers/health.controller';
import { MetricsController } from './infrastructure/controllers/metrics.controller';
import { AuthService } from './infrastructure/services/auth.service';
import { UserRepository } from './infrastructure/repositories/user.repository';
import { SessionRepository } from './infrastructure/repositories/session.repository';
import { EmailVerificationRepository } from './infrastructure/repositories/email-verification.repository';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { LocalStrategy } from './infrastructure/strategies/local.strategy';
import { PasswordService } from './infrastructure/services/password.service';
import { TokenService } from './infrastructure/services/token.service';
import { EmailService } from './infrastructure/services/email.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: process.env.JWT_EXPIRES_IN || '15m',
          },
        };
      },
    }),
  ],
  controllers: [AuthController, InternalController, HealthController, MetricsController],
  providers: [
    AuthService,
    UserRepository,
    SessionRepository,
    EmailVerificationRepository,
    PasswordService,
    TokenService,
    EmailService,
    JwtStrategy,
    LocalStrategy,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly emailVerificationRepository: EmailVerificationRepository,
  ) {}

  async onModuleInit() {
    await this.userRepository.initialize();
    await this.sessionRepository.initialize();
    await this.emailVerificationRepository.initialize();
  }
}
