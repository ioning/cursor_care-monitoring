import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrganizationController } from './infrastructure/controllers/organization.controller';
import { OrganizationService } from './application/services/organization.service';
import { OrganizationRepository } from './infrastructure/repositories/organization.repository';
import { createLogger } from '../../shared/libs/logger';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationRepository],
  exports: [OrganizationService, OrganizationRepository],
})
export class AppModule implements OnModuleInit {
  private readonly logger = createLogger({ serviceName: 'organization-service' });

  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async onModuleInit() {
    try {
      await this.organizationRepository.initialize();
      this.logger.info('Organization repository initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize organization repository', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}


import { ConfigModule } from '@nestjs/config';
import { OrganizationController } from './infrastructure/controllers/organization.controller';
import { OrganizationService } from './application/services/organization.service';
import { OrganizationRepository } from './infrastructure/repositories/organization.repository';
import { createLogger } from '../../shared/libs/logger';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationRepository],
  exports: [OrganizationService, OrganizationRepository],
})
export class AppModule implements OnModuleInit {
  private readonly logger = createLogger({ serviceName: 'organization-service' });

  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async onModuleInit() {
    try {
      await this.organizationRepository.initialize();
      this.logger.info('Organization repository initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize organization repository', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}







