import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { BillingController } from './infrastructure/controllers/billing.controller';
import { YooKassaWebhookController } from './infrastructure/payment-providers/yookassa/yookassa.webhook.controller';
import { HealthController } from './infrastructure/controllers/health.controller';
import { MetricsController } from './infrastructure/controllers/metrics.controller';
import { BillingService } from './application/services/billing.service';
import { SubscriptionRepository } from './infrastructure/repositories/subscription.repository';
import { PaymentRepository } from './infrastructure/repositories/payment.repository';
import { InvoiceRepository } from './infrastructure/repositories/invoice.repository';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { YooKassaAdapter } from './infrastructure/payment-providers/yookassa/yookassa.adapter';

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
          console.warn('[billing-service] JWT_SECRET is not set; using default from env.example. Set JWT_SECRET for real auth.');
        }
        return {
          secret: jwtSecret,
        };
      },
    }),
  ],
  controllers: [BillingController, YooKassaWebhookController, HealthController, MetricsController],
  providers: [
    BillingService,
    SubscriptionRepository,
    PaymentRepository,
    InvoiceRepository,
    JwtStrategy,
    YooKassaAdapter,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async onModuleInit() {
    await this.subscriptionRepository.initialize();
    await this.paymentRepository.initialize();
    await this.invoiceRepository.initialize();
  }
}

