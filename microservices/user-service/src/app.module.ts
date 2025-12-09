import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserController } from './infrastructure/controllers/user.controller';
import { FamilyAccessController } from './infrastructure/controllers/family-access.controller';
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
        };
      },
    }),
  ],
  controllers: [UserController, FamilyAccessController],
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

