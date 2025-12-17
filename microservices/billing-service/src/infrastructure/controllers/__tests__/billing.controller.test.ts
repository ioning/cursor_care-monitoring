import { Test, TestingModule } from '@nestjs/testing';
import { BillingController } from '../billing.controller';
import { BillingService } from '../../application/services/billing.service';

describe('BillingController', () => {
  let controller: BillingController;
  let billingService: any;

  beforeEach(async () => {
    billingService = {
      getSubscription: jest.fn(),
      createSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
      getInvoices: jest.fn(),
      processPayment: jest.fn(),
      getPaymentStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        {
          provide: BillingService,
          useValue: billingService,
        },
      ],
    }).compile();

    controller = module.get<BillingController>(BillingController);
  });

  describe('getSubscription', () => {
    it('should get user subscription', async () => {
      const userId = 'user-1';
      const expectedResult = {
        success: true,
        data: {
          id: 'sub-1',
          userId,
          planId: 'plan-1',
          status: 'active',
        },
      };

      billingService.getSubscription.mockResolvedValue(expectedResult);

      const result = await controller.getSubscription({ user: { id: userId } } as any);

      expect(result).toEqual(expectedResult);
      expect(billingService.getSubscription).toHaveBeenCalledWith(userId);
    });
  });

  describe('createSubscription', () => {
    it('should create subscription', async () => {
      const userId = 'user-1';
      const body = { planId: 'plan-1' };
      const expectedResult = {
        success: true,
        data: {
          id: 'sub-1',
          userId,
          planId: body.planId,
        },
      };

      billingService.createSubscription.mockResolvedValue(expectedResult);

      const result = await controller.createSubscription({ user: { id: userId } } as any, body);

      expect(result).toEqual(expectedResult);
      expect(billingService.createSubscription).toHaveBeenCalledWith(userId, body.planId);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription', async () => {
      const userId = 'user-1';
      const expectedResult = {
        success: true,
        message: 'Subscription cancelled successfully',
      };

      billingService.cancelSubscription.mockResolvedValue(expectedResult);

      const result = await controller.cancelSubscription({ user: { id: userId } } as any);

      expect(result).toEqual(expectedResult);
      expect(billingService.cancelSubscription).toHaveBeenCalledWith(userId);
    });
  });

  describe('getInvoices', () => {
    it('should get invoices', async () => {
      const userId = 'user-1';
      const query = { page: 1, limit: 10 };
      const expectedResult = {
        success: true,
        data: [
          {
            id: 'inv-1',
            userId,
            amount: 1000,
            status: 'paid',
          },
        ],
      };

      billingService.getInvoices.mockResolvedValue(expectedResult);

      const result = await controller.getInvoices({ user: { id: userId } } as any, query);

      expect(result).toEqual(expectedResult);
      expect(billingService.getInvoices).toHaveBeenCalledWith(userId, query);
    });
  });

  describe('createPayment', () => {
    it('should create payment', async () => {
      const userId = 'user-1';
      const body = {
        amount: 1000,
        currency: 'RUB',
        paymentMethod: 'card',
      };
      const expectedResult = {
        success: true,
        data: {
          id: 'pay-1',
          userId,
          amount: body.amount,
        },
      };

      billingService.processPayment.mockResolvedValue(expectedResult);

      const result = await controller.createPayment({ user: { id: userId } } as any, body);

      expect(result).toEqual(expectedResult);
      expect(billingService.processPayment).toHaveBeenCalledWith(userId, body);
    });
  });

  describe('getPaymentStatus', () => {
    it('should get payment status', async () => {
      const paymentId = 'pay-1';
      const expectedResult = {
        success: true,
        data: {
          id: paymentId,
          status: 'completed',
        },
      };

      billingService.getPaymentStatus.mockResolvedValue(expectedResult);

      const result = await controller.getPaymentStatus({ user: { id: 'user-1' } } as any, paymentId);

      expect(result).toEqual(expectedResult);
      expect(billingService.getPaymentStatus).toHaveBeenCalledWith(paymentId);
    });
  });
});

