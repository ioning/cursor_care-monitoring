import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AnalyticsController } from './infrastructure/controllers/analytics.controller';
import { ReportTemplateController } from './infrastructure/controllers/report-template.controller';
import { AnalyticsService } from './application/services/analytics.service';
import { ReportTemplateService } from './application/services/report-template.service';
import { ReportRepository } from './infrastructure/repositories/report.repository';
import { ReportTemplateRepository } from './infrastructure/repositories/report-template.repository';
import { ReportFileRepository } from './infrastructure/repositories/report-file.repository';
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
  controllers: [AnalyticsController, ReportTemplateController],
  providers: [
    AnalyticsService,
    ReportTemplateService,
    ReportRepository,
    ReportTemplateRepository,
    ReportFileRepository,
    JwtStrategy,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly reportTemplateRepository: ReportTemplateRepository,
    private readonly reportFileRepository: ReportFileRepository,
  ) {}

  async onModuleInit() {
    await this.reportRepository.initialize();
    await this.reportTemplateRepository.initialize();
    await this.reportFileRepository.initialize();
  }
}

