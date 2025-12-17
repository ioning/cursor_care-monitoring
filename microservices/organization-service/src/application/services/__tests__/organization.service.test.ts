import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrganizationService } from '../organization.service';
import { OrganizationRepository } from '../../../infrastructure/repositories/organization.repository';
import { OrganizationStatus, SubscriptionTier } from '../../../../../../shared/types/common.types';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock('../../../../../../shared/libs/logger', () => ({
  createLogger: jest.fn(() => mockLogger),
}));

describe('OrganizationService', () => {
  let organizationService: OrganizationService;
  let organizationRepository: any;

  beforeEach(() => {
    organizationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
    };

    organizationService = new OrganizationService(organizationRepository);
    jest.clearAllMocks();
  });

  describe('createOrganization', () => {
    it('should create organization successfully', async () => {
      const data = {
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test Description',
        subscriptionTier: SubscriptionTier.BASIC,
      };

      const organization = {
        id: 'org-1',
        ...data,
        status: OrganizationStatus.ACTIVE,
        features: {},
        settings: {},
      };

      organizationRepository.findBySlug.mockResolvedValue(null);
      organizationRepository.create.mockResolvedValue(organization);

      const result = await organizationService.createOrganization(data);

      expect(result).toEqual(organization);
      expect(organizationRepository.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if slug already exists', async () => {
      const data = {
        name: 'Test Organization',
        slug: 'existing-slug',
      };

      organizationRepository.findBySlug.mockResolvedValue({ id: 'org-1', slug: 'existing-slug' });

      await expect(organizationService.createOrganization(data)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getOrganization', () => {
    it('should return organization by id', async () => {
      const organization = {
        id: 'org-1',
        name: 'Test Organization',
        slug: 'test-org',
        status: OrganizationStatus.ACTIVE,
      };

      organizationRepository.findById.mockResolvedValue(organization);

      const result = await organizationService.getOrganization('org-1');

      expect(result).toEqual(organization);
    });

    it('should throw NotFoundException if organization not found', async () => {
      organizationRepository.findById.mockResolvedValue(null);

      await expect(organizationService.getOrganization('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getOrganizationBySlug', () => {
    it('should return organization by slug', async () => {
      const organization = {
        id: 'org-1',
        name: 'Test Organization',
        slug: 'test-org',
      };

      organizationRepository.findBySlug.mockResolvedValue(organization);

      const result = await organizationService.getOrganizationBySlug('test-org');

      expect(result).toEqual(organization);
    });

    it('should throw NotFoundException if organization not found', async () => {
      organizationRepository.findBySlug.mockResolvedValue(null);

      await expect(organizationService.getOrganizationBySlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateOrganization', () => {
    it('should update organization successfully', async () => {
      const organization = {
        id: 'org-1',
        name: 'Test Organization',
        slug: 'test-org',
      };

      const updates = { name: 'Updated Name' };
      const updated = { ...organization, ...updates };

      organizationRepository.findById.mockResolvedValue(organization);
      organizationRepository.update.mockResolvedValue(updated);

      const result = await organizationService.updateOrganization('org-1', updates);

      expect(result.name).toBe(updates.name);
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription tier', async () => {
      const organization = {
        id: 'org-1',
        subscriptionTier: SubscriptionTier.BASIC,
      };

      organizationRepository.findById.mockResolvedValue(organization);
      organizationRepository.update.mockResolvedValue({
        ...organization,
        subscriptionTier: SubscriptionTier.PROFESSIONAL,
      });

      const result = await organizationService.updateSubscription(
        'org-1',
        SubscriptionTier.PROFESSIONAL,
      );

      expect(result.subscriptionTier).toBe(SubscriptionTier.PROFESSIONAL);
    });
  });
});

