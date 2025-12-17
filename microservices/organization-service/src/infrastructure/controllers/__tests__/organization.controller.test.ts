import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OrganizationController } from '../organization.controller';
import { OrganizationService } from '../../application/services/organization.service';
import { SubscriptionTier, OrganizationStatus } from '../../../../shared/types/common.types';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let organizationService: any;

  beforeEach(async () => {
    organizationService = {
      createOrganization: jest.fn(),
      getOrganization: jest.fn(),
      getOrganizationBySlug: jest.fn(),
      updateOrganization: jest.fn(),
      getOrganizationStats: jest.fn(),
      checkLimits: jest.fn(),
      updateSubscription: jest.fn(),
      suspendOrganization: jest.fn(),
      activateOrganization: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [
        {
          provide: OrganizationService,
          useValue: organizationService,
        },
      ],
    }).compile();

    controller = module.get<OrganizationController>(OrganizationController);
  });

  describe('createOrganization', () => {
    it('should create organization', async () => {
      const body = {
        name: 'Test Org',
        slug: 'test-org',
        description: 'Test description',
        subscriptionTier: SubscriptionTier.BASIC,
      };

      const expectedResult = {
        id: 'org-1',
        ...body,
      };

      organizationService.createOrganization.mockResolvedValue(expectedResult);

      const result = await controller.createOrganization(body);

      expect(result).toEqual({
        success: true,
        data: expectedResult,
        message: 'Organization created successfully',
      });
      expect(organizationService.createOrganization).toHaveBeenCalledWith(body);
    });

    it('should throw BadRequestException if name is missing', async () => {
      const body = {
        slug: 'test-org',
      };

      await expect(controller.createOrganization(body as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(organizationService.createOrganization).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if slug is missing', async () => {
      const body = {
        name: 'Test Org',
      };

      await expect(controller.createOrganization(body as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(organizationService.createOrganization).not.toHaveBeenCalled();
    });
  });

  describe('getOrganization', () => {
    it('should get organization by ID', async () => {
      const id = 'org-1';
      const expectedResult = {
        id,
        name: 'Test Org',
      };

      organizationService.getOrganization.mockResolvedValue(expectedResult);

      const result = await controller.getOrganization(id);

      expect(result).toEqual({
        success: true,
        data: expectedResult,
      });
      expect(organizationService.getOrganization).toHaveBeenCalledWith(id);
    });
  });

  describe('getOrganizationBySlug', () => {
    it('should get organization by slug', async () => {
      const slug = 'test-org';
      const expectedResult = {
        id: 'org-1',
        slug,
        name: 'Test Org',
      };

      organizationService.getOrganizationBySlug.mockResolvedValue(expectedResult);

      const result = await controller.getOrganizationBySlug(slug);

      expect(result).toEqual({
        success: true,
        data: expectedResult,
      });
      expect(organizationService.getOrganizationBySlug).toHaveBeenCalledWith(slug);
    });
  });

  describe('updateOrganization', () => {
    it('should update organization for same user organization', async () => {
      const id = 'org-1';
      const body = {
        name: 'Updated Org',
      };
      const req = {
        user: {
          id: 'user-1',
          organizationId: id,
          role: 'guardian',
        },
      };
      const expectedResult = {
        id,
        ...body,
      };

      organizationService.updateOrganization.mockResolvedValue(expectedResult);

      const result = await controller.updateOrganization(id, req as any, body);

      expect(result).toEqual({
        success: true,
        data: expectedResult,
        message: 'Organization updated successfully',
      });
      expect(organizationService.updateOrganization).toHaveBeenCalledWith(id, body);
    });

    it('should update organization for admin', async () => {
      const id = 'org-1';
      const body = {
        name: 'Updated Org',
      };
      const req = {
        user: {
          id: 'admin-1',
          organizationId: 'org-2',
          role: 'admin',
        },
      };
      const expectedResult = {
        id,
        ...body,
      };

      organizationService.updateOrganization.mockResolvedValue(expectedResult);

      const result = await controller.updateOrganization(id, req as any, body);

      expect(result).toEqual({
        success: true,
        data: expectedResult,
        message: 'Organization updated successfully',
      });
    });

    it('should throw BadRequestException if user does not have access', async () => {
      const id = 'org-1';
      const body = {
        name: 'Updated Org',
      };
      const req = {
        user: {
          id: 'user-1',
          organizationId: 'org-2',
          role: 'guardian',
        },
      };

      await expect(controller.updateOrganization(id, req as any, body)).rejects.toThrow(
        BadRequestException,
      );
      expect(organizationService.updateOrganization).not.toHaveBeenCalled();
    });
  });

  describe('getOrganizationStats', () => {
    it('should get organization stats for same user organization', async () => {
      const id = 'org-1';
      const req = {
        user: {
          id: 'user-1',
          organizationId: id,
          role: 'guardian',
        },
      };
      const expectedResult = {
        totalWards: 10,
        totalDispatchers: 5,
        totalGuardians: 20,
      };

      organizationService.getOrganizationStats.mockResolvedValue(expectedResult);

      const result = await controller.getOrganizationStats(id, req as any);

      expect(result).toEqual({
        success: true,
        data: expectedResult,
      });
      expect(organizationService.getOrganizationStats).toHaveBeenCalledWith(id);
    });

    it('should throw BadRequestException if user does not have access', async () => {
      const id = 'org-1';
      const req = {
        user: {
          id: 'user-1',
          organizationId: 'org-2',
          role: 'guardian',
        },
      };

      await expect(controller.getOrganizationStats(id, req as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(organizationService.getOrganizationStats).not.toHaveBeenCalled();
    });
  });

  describe('checkLimits', () => {
    it('should check limits for same user organization', async () => {
      const id = 'org-1';
      const resource = 'wards' as const;
      const req = {
        user: {
          id: 'user-1',
          organizationId: id,
          role: 'guardian',
        },
      };
      const expectedResult = {
        current: 10,
        limit: 20,
        available: 10,
      };

      organizationService.checkLimits.mockResolvedValue(expectedResult);

      const result = await controller.checkLimits(id, resource, req as any);

      expect(result).toEqual({
        success: true,
        data: expectedResult,
      });
      expect(organizationService.checkLimits).toHaveBeenCalledWith(id, resource);
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription for admin', async () => {
      const id = 'org-1';
      const body = {
        subscriptionTier: SubscriptionTier.PREMIUM,
        planId: 'plan-1',
      };
      const req = {
        user: {
          id: 'admin-1',
          role: 'admin',
        },
      };
      const expectedResult = {
        id,
        subscriptionTier: body.subscriptionTier,
      };

      organizationService.updateSubscription.mockResolvedValue(expectedResult);

      const result = await controller.updateSubscription(id, req as any, body);

      expect(result).toEqual({
        success: true,
        data: expectedResult,
        message: 'Subscription updated successfully',
      });
      expect(organizationService.updateSubscription).toHaveBeenCalledWith(
        id,
        body.subscriptionTier,
        body.planId,
      );
    });

    it('should throw BadRequestException if user is not admin', async () => {
      const id = 'org-1';
      const body = {
        subscriptionTier: SubscriptionTier.PREMIUM,
      };
      const req = {
        user: {
          id: 'user-1',
          role: 'guardian',
        },
      };

      await expect(controller.updateSubscription(id, req as any, body)).rejects.toThrow(
        BadRequestException,
      );
      expect(organizationService.updateSubscription).not.toHaveBeenCalled();
    });
  });

  describe('suspendOrganization', () => {
    it('should suspend organization for admin', async () => {
      const id = 'org-1';
      const req = {
        user: {
          id: 'admin-1',
          role: 'admin',
        },
      };
      const expectedResult = {
        id,
        status: OrganizationStatus.SUSPENDED,
      };

      organizationService.suspendOrganization.mockResolvedValue(expectedResult);

      const result = await controller.suspendOrganization(id, req as any);

      expect(result).toEqual({
        success: true,
        data: expectedResult,
        message: 'Organization suspended successfully',
      });
      expect(organizationService.suspendOrganization).toHaveBeenCalledWith(id);
    });

    it('should throw BadRequestException if user is not admin', async () => {
      const id = 'org-1';
      const req = {
        user: {
          id: 'user-1',
          role: 'guardian',
        },
      };

      await expect(controller.suspendOrganization(id, req as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(organizationService.suspendOrganization).not.toHaveBeenCalled();
    });
  });

  describe('activateOrganization', () => {
    it('should activate organization for admin', async () => {
      const id = 'org-1';
      const req = {
        user: {
          id: 'admin-1',
          role: 'admin',
        },
      };
      const expectedResult = {
        id,
        status: OrganizationStatus.ACTIVE,
      };

      organizationService.activateOrganization.mockResolvedValue(expectedResult);

      const result = await controller.activateOrganization(id, req as any);

      expect(result).toEqual({
        success: true,
        data: expectedResult,
        message: 'Organization activated successfully',
      });
      expect(organizationService.activateOrganization).toHaveBeenCalledWith(id);
    });

    it('should throw BadRequestException if user is not admin', async () => {
      const id = 'org-1';
      const req = {
        user: {
          id: 'user-1',
          role: 'guardian',
        },
      };

      await expect(controller.activateOrganization(id, req as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(organizationService.activateOrganization).not.toHaveBeenCalled();
    });
  });
});

