import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IntegrationController } from './infrastructure/controllers/integration.controller';
import { HealthController } from './infrastructure/controllers/health.controller';
import { MetricsController } from './infrastructure/controllers/metrics.controller';
import { IntegrationService } from './application/services/integration.service';
import { EmailService } from './infrastructure/services/email.service';
import { SendGridService } from './infrastructure/services/email/sendgrid.service';
import { SmsService } from './infrastructure/services/sms.service';
import { SMSRuService } from './infrastructure/services/sms/smsru.service';
import { PushService } from './infrastructure/services/push.service';
import { FCMService } from './infrastructure/services/push/fcm.service';
import { TelegramService } from './infrastructure/services/telegram.service';
import { NotificationRepository } from './infrastructure/repositories/notification.repository';
import { NotificationTemplateService } from './application/services/notification-template.service';
import { UserServiceClient } from './infrastructure/clients/user-service.client';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
  ],
  controllers: [IntegrationController, HealthController, MetricsController],
  providers: [
    IntegrationService,
    EmailService,
    SmsService,
    PushService,
    TelegramService,
    NotificationRepository,
    NotificationTemplateService,
    UserServiceClient,
  ],
})
export class AppModule {}

