import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationController } from '../integration.controller';
import { IntegrationService } from '../../application/services/integration.service';

describe('IntegrationController', () => {
  let controller: IntegrationController;
  let integrationService: any;

  beforeEach(async () => {
    integrationService = {
      getNotifications: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntegrationController],
      providers: [
        {
          provide: IntegrationService,
          useValue: integrationService,
        },
      ],
    }).compile();

    controller = module.get<IntegrationController>(IntegrationController);
  });

  describe('getNotifications', () => {
    it('should get notification history for user', async () => {
      const userId = 'user-1';
      const expectedResult = {
        success: true,
        data: [],
        message: 'Notifications retrieved successfully',
      };

      const result = await controller.getNotifications(userId);

      expect(result).toEqual(expectedResult);
    });

    it('should return empty array if no notifications', async () => {
      const userId = 'user-1';
      const result = await controller.getNotifications(userId);

      expect(result).toEqual({
        success: true,
        data: [],
        message: 'Notifications retrieved successfully',
      });
    });
  });
});

