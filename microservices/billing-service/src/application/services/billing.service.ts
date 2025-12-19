import { Injectable } from '@nestjs/common';
import { SubscriptionRepository } from '../../infrastructure/repositories/subscription.repository';
import { PaymentRepository } from '../../infrastructure/repositories/payment.repository';
import { InvoiceRepository } from '../../infrastructure/repositories/invoice.repository';
import { YooKassaAdapter } from '../../infrastructure/payment-providers/yookassa/yookassa.adapter';
import { createLogger } from '../../../../../shared/libs/logger';
import { randomUUID } from 'crypto';

@Injectable()
export class BillingService {
  private readonly logger = createLogger({ serviceName: 'billing-service' });

  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly yooKassaAdapter: YooKassaAdapter,
  ) {}

  async getSubscription(userId: string) {
    const subscription = await this.subscriptionRepository.findByUserId(userId);
    return {
      success: true,
      data: subscription,
    };
  }

  async createSubscription(userId: string, planId: string) {
    const subscriptionId = randomUUID();
    const subscription = await this.subscriptionRepository.create({
      id: subscriptionId,
      userId,
      planId,
      status: 'active',
      startDate: new Date(),
      endDate: this.calculateEndDate(planId),
    });

    this.logger.info(`Subscription created: ${subscriptionId}`, { userId, planId });

    return {
      success: true,
      data: subscription,
      message: 'Subscription created successfully',
    };
  }

  async cancelSubscription(userId: string) {
    await this.subscriptionRepository.updateStatus(userId, 'cancelled');
    return {
      success: true,
      message: 'Subscription cancelled',
    };
  }

  async getInvoices(userId: string, filters: any) {
    const { page = 1, limit = 20 } = filters;
    const [invoices, total] = await this.invoiceRepository.findByUserId(
      userId,
      { page, limit },
    );

    return {
      success: true,
      data: invoices,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async processPayment(userId: string, paymentData: any) {
    const paymentId = randomUUID();

    // Создаем платеж через YooKassa
    const paymentResponse = await this.yooKassaAdapter.createPayment({
      amount: paymentData.amount,
      currency: paymentData.currency || 'RUB',
      description: paymentData.description || `Payment for subscription`,
      returnUrl: paymentData.returnUrl || `${process.env.FRONTEND_URL}/billing/success`,
      metadata: {
        userId,
        subscriptionId: paymentData.subscriptionId,
        ...paymentData.metadata,
      },
    });

    // Сохраняем платеж в БД
    const payment = await this.paymentRepository.create({
      id: paymentResponse.id,
      userId,
      amount: paymentData.amount,
      currency: paymentData.currency || 'RUB',
      method: 'yookassa',
      status: paymentResponse.status,
      metadata: {
        ...paymentData.metadata,
        confirmationUrl: paymentResponse.confirmationUrl,
      },
    });

    this.logger.info(`Payment created: ${paymentResponse.id}`, {
      userId,
      amount: paymentData.amount,
      status: paymentResponse.status,
    });

    return {
      success: true,
      data: {
        ...payment,
        confirmationUrl: paymentResponse.confirmationUrl,
      },
      message: 'Payment created successfully',
    };
  }

  async getPaymentStatus(paymentId: string) {
    try {
      const status = await this.yooKassaAdapter.getPaymentStatus(paymentId);
      return {
        success: true,
        data: status,
      };
    } catch (error: any) {
      this.logger.error('Failed to get payment status', {
        paymentId,
        error: error.message,
      });
      throw error;
    }
  }

  private calculateEndDate(planId: string): Date {
    const endDate = new Date();
    // Default to 1 month
    endDate.setMonth(endDate.getMonth() + 1);
    return endDate;
  }
}
