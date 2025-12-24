import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserController } from './infrastructure/controllers/user.controller';
import { FamilyAccessController } from './infrastructure/controllers/family-access.controller';
import { InternalController } from './infrastructure/controllers/internal.controller';
import { HealthController } from './infrastructure/controllers/health.controller';
import { MetricsController } from './infrastructure/controllers/metrics.controller';
import { UserService } from './application/services/user.service';
import { WardService } from './application/services/ward.service';
import { WardAccessPermissionService } from './application/services/ward-access-permission.service';
import { FamilyAccessService } from './application/services/family-access.service';
import { UserRepository } from './infrastructure/repositories/user.repository';
import { WardRepository } from './infrastructure/repositories/ward.repository';
import { GuardianWardRepository } from './infrastructure/repositories/guardian-ward.repository';
import { WardAccessPermissionRepository } from './infrastructure/repositories/ward-access-permission.repository';
import { WardAccessAuditRepository } from './infrastructure/repositories/ward-access-audit.repository';
import { FamilyChatRepository } from './infrastructure/repositories/family-chat.repository';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { AuthServiceClient } from './infrastructure/clients/auth-service.client';
import { IntegrationServiceClient } from './infrastructure/clients/integration-service.client';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const jwtSecret = process.env.JWT_SECRET || 'please-change-me';
        if (!process.env.JWT_SECRET) {
          // eslint-disable-next-line no-console
          console.warn('[user-service] JWT_SECRET is not set; using default from env.example. Set JWT_SECRET for real auth.');
        }
        return {
          secret: jwtSecret,
        };
      },
    }),
  ],
  controllers: [UserController, FamilyAccessController, InternalController, HealthController, MetricsController],
  providers: [
    UserService,
    WardService,
    WardAccessPermissionService,
    FamilyAccessService,
    UserRepository,
    WardRepository,
    GuardianWardRepository,
    WardAccessPermissionRepository,
    WardAccessAuditRepository,
    FamilyChatRepository,
    JwtStrategy,
    AuthServiceClient,
    IntegrationServiceClient,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly wardRepository: WardRepository,
    private readonly guardianWardRepository: GuardianWardRepository,
    private readonly wardAccessPermissionRepository: WardAccessPermissionRepository,
    private readonly wardAccessAuditRepository: WardAccessAuditRepository,
    private readonly familyChatRepository: FamilyChatRepository,
  ) {}

  async onModuleInit() {
    await this.userRepository.initialize();
    await this.wardRepository.initialize();
    await this.guardianWardRepository.initialize();
    await this.wardAccessPermissionRepository.initialize();
    await this.wardAccessAuditRepository.initialize();
    await this.familyChatRepository.initialize();
  }
}

