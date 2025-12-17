import { BillingService } from '../billing.service';
import { SubscriptionRepository } from '../../../infrastructure/repositories/subscription.repository';
import { PaymentRepository } from '../../../infrastructure/repositories/payment.repository';
import { InvoiceRepository } from '../../../infrastructure/repositories/invoice.repository';
import { YooKassaAdapter } from '../../../infrastructure/payment-providers/yookassa/yookassa.adapter';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock('../../../../../../shared/libs/logger', () => ({
  createLogger: jest.fn(() => mockLogger),
}));

describe('BillingService', () => {
  let billingService: BillingService;
  let subscriptionRepository: any;
  let paymentRepository: any;
  let invoiceRepository: any;
  let yooKassaAdapter: any;

  beforeEach(() => {
    subscriptionRepository = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
    };

    paymentRepository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
    };

    invoiceRepository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
    };

    yooKassaAdapter = {
      createPayment: jest.fn(),
      getPaymentStatus: jest.fn(),
    };

    billingService = new BillingService(
      subscriptionRepository,
      paymentRepository,
      invoiceRepository,
      yooKassaAdapter,
    );
    jest.clearAllMocks();
  });

  describe('getSubscription', () => {
    it('should return subscription for user', async () => {
      const userId = 'user-1';
      const subscription = {
        id: 'sub-1',
        userId,
        planId: 'plan-1',
        status: 'active',
      };

      subscriptionRepository.findByUserId.mockResolvedValue(subscription);

      const result = await billingService.getSubscription(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(subscription);
    });

    it('should return null if no subscription found', async () => {
      subscriptionRepository.findByUserId.mockResolvedValue(null);

      const result = await billingService.getSubscription('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('createSubscription', () => {
    it('should create subscription successfully', async () => {
      const userId = 'user-1';
      const planId = 'plan-1';

      const subscription = {
        id: 'sub-1',
        userId,
        planId,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(),
      };

      subscriptionRepository.create.mockResolvedValue(subscription);

      const result = await billingService.createSubscription(userId, planId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(subscription);
      expect(subscriptionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          planId,
          status: 'active',
        }),
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      const userId = 'user-1';

      subscriptionRepository.updateStatus.mockResolvedValue(undefined);

      const result = await billingService.cancelSubscription(userId);

      expect(result.success).toBe(true);
      expect(subscriptionRepository.updateStatus).toHaveBeenCalledWith(userId, 'cancelled');
    });
  });

  describe('createPayment', () => {
    it('should create payment successfully', async () => {
      const userId = 'user-1';
      const amount = 1000;
      const currency = 'RUB';

      const paymentData = {
        id: 'payment-1',
        userId,
        amount,
        currency,
        status: 'pending',
      };

      yooKassaAdapter.createPayment.mockResolvedValue({
        id: 'payment-1',
        confirmationUrl: 'https://yookassa.ru/payment',
      });

      paymentRepository.create.mockResolvedValue(paymentData);

      const result = await billingService.createPayment(userId, amount, currency);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('confirmationUrl');
    });
  });

  describe('getPayments', () => {
    it('should return payments for user', async () => {
      const userId = 'user-1';
      const payments = [
        { id: 'payment-1', userId, amount: 1000 },
        { id: 'payment-2', userId, amount: 2000 },
      ];

      paymentRepository.findByUserId.mockResolvedValue(payments);

      const result = await billingService.getPayments(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(payments);
    });
  });

  describe('getInvoices', () => {
    it('should return invoices for user', async () => {
      const userId = 'user-1';
      const invoices = [
        { id: 'invoice-1', userId, amount: 1000 },
        { id: 'invoice-2', userId, amount: 2000 },
      ];

      invoiceRepository.findByUserId.mockResolvedValue(invoices);

      const result = await billingService.getInvoices(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(invoices);
    });
  });
});

