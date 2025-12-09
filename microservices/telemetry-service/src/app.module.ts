import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelemetryController } from './infrastructure/controllers/telemetry.controller';
import { TelemetryService } from './application/services/telemetry.service';
import { TelemetryRepository } from './infrastructure/repositories/telemetry.repository';
import { TelemetryEventPublisher } from './infrastructure/messaging/telemetry-event.publisher';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
  ],
  controllers: [TelemetryController],
  providers: [TelemetryService, TelemetryRepository, TelemetryEventPublisher],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly telemetryRepository: TelemetryRepository) {}

  async onModuleInit() {
    await this.telemetryRepository.initialize();
  }
}

