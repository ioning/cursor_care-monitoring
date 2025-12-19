import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { YooKassaAdapter } from './yookassa.adapter';
import { PaymentRepository } from '../../repositories/payment.repository';
import { InvoiceRepository } from '../../repositories/invoice.repository';
import { createLogger } from '../../../../../../shared/libs/logger';

@ApiTags('billing')
@Controller('billing/webhooks')
export class YooKassaWebhookController {
  private readonly logger = createLogger({ serviceName: 'billing-service' });

  constructor(
    private readonly yooKassaAdapter: YooKassaAdapter,
    private readonly paymentRepository: PaymentRepository,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  @Post('yookassa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'YooKassa webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-yoomoney-signature') signature: string,
  ) {
    try {
      // Валидация подписи
      if (!this.yooKassaAdapter.validateWebhook(payload, signature)) {
        this.logger.warn('Invalid YooKassa webhook signature', { payload });
        return { success: false, message: 'Invalid signature' };
      }

      // Обработка webhook
      const paymentStatus = await this.yooKassaAdapter.processWebhook(payload);

      // Обновление статуса платежа в БД
      await this.paymentRepository.updateStatus(paymentStatus.id, paymentStatus.status);

      // Если платеж успешен, создаем или обновляем invoice
      if (paymentStatus.status === 'succeeded' && paymentStatus.paid) {
        const payment = await this.paymentRepository.findById(paymentStatus.id);
        if (payment) {
          // Проверяем, есть ли уже invoice
          const existingInvoice = await this.invoiceRepository.findByPaymentId(
            paymentStatus.id,
          );

          if (!existingInvoice) {
            await this.invoiceRepository.create({
              id: randomUUID(),
              userId: payment.userId,
              paymentId: paymentStatus.id,
              amount: parseFloat(paymentStatus.amount.value),
              currency: paymentStatus.amount.currency,
              status: 'paid',
            });
          }
        }
      }

      this.logger.info('YooKassa webhook processed', {
        paymentId: paymentStatus.id,
        status: paymentStatus.status,
      });

      return { success: true };
    } catch (error: any) {
      this.logger.error('Failed to process YooKassa webhook', {
        error: error.message,
        payload,
      });
      return { success: false, message: error.message };
    }
  }
}

