import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrganizationRepository, Organization } from '../../infrastructure/repositories/organization.repository';
import { OrganizationStatus, SubscriptionTier } from '../../../../../shared/types/common.types';
import { createLogger } from '../../../../../shared/libs/logger';

@Injectable()
export class OrganizationService {
  private readonly logger = createLogger({ serviceName: 'organization-service' });

  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async createOrganization(data: {
    name: string;
    slug: string;
    description?: string;
    subscriptionTier?: SubscriptionTier;
    maxWards?: number;
    maxDispatchers?: number;
    maxGuardians?: number;
    billingEmail?: string;
    contactEmail?: string;
    contactPhone?: string;
    deviceSerialNumbers?: string[];
    trialDays?: number;
  }): Promise<Organization> {
    // Проверка уникальности slug
    const existing = await this.organizationRepository.findBySlug(data.slug);
    if (existing) {
      throw new BadRequestException(`Organization with slug "${data.slug}" already exists`);
    }

    const organization = await this.organizationRepository.create({
      ...data,
      features: this.getDefaultFeatures(data.subscriptionTier),
      settings: this.getDefaultSettings(),
      deviceSerialNumbers: data.deviceSerialNumbers || [],
    });

    this.logger.info(`Organization created: ${organization.id}`, {
      organizationId: organization.id,
      slug: organization.slug,
      tier: organization.subscriptionTier,
    });

    return organization;
  }

  async getOrganization(id: string): Promise<Organization> {
    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new NotFoundException(`Organization with id ${id} not found`);
    }
    return organization;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization> {
    const organization = await this.organizationRepository.findBySlug(slug);
    if (!organization) {
      throw new NotFoundException(`Organization with slug "${slug}" not found`);
    }
    return organization;
  }

  async getOrganizationBySerialNumber(serialNumber: string): Promise<Organization> {
    // Ищем организацию по серийному номеру
    let organization = await this.organizationRepository.findBySerialNumber(serialNumber);
    
    // Если не найдена, возвращаем primary организацию
    if (!organization) {
      organization = await this.organizationRepository.getPrimaryOrganization();
      if (!organization) {
        throw new NotFoundException('Primary organization not found');
      }
    }
    
    return organization;
  }

  async addSerialNumbers(organizationId: string, serialNumbers: string[]): Promise<Organization> {
    const organization = await this.getOrganization(organizationId);
    const existingNumbers = organization.deviceSerialNumbers || [];
    const newNumbers = [...new Set([...existingNumbers, ...serialNumbers])]; // Удаляем дубликаты
    
    return this.organizationRepository.update(organizationId, {
      deviceSerialNumbers: newNumbers,
    });
  }

  async removeSerialNumbers(organizationId: string, serialNumbers: string[]): Promise<Organization> {
    const organization = await this.getOrganization(organizationId);
    const existingNumbers = organization.deviceSerialNumbers || [];
    const newNumbers = existingNumbers.filter((sn) => !serialNumbers.includes(sn));
    
    return this.organizationRepository.update(organizationId, {
      deviceSerialNumbers: newNumbers,
    });
  }

  async updateOrganization(
    id: string,
    data: Partial<Organization>,
  ): Promise<Organization> {
    const organization = await this.getOrganization(id);
    return this.organizationRepository.update(id, data);
  }

  async updateSubscription(
    organizationId: string,
    subscriptionTier: SubscriptionTier,
    planId?: string,
  ): Promise<Organization> {
    const organization = await this.getOrganization(organizationId);
    return this.organizationRepository.update(organizationId, {
      subscriptionTier,
      subscriptionPlanId: planId,
      features: this.getDefaultFeatures(subscriptionTier),
    });
  }

  async suspendOrganization(organizationId: string): Promise<Organization> {
    return this.organizationRepository.update(organizationId, {
      status: OrganizationStatus.SUSPENDED,
    });
  }

  async activateOrganization(organizationId: string): Promise<Organization> {
    return this.organizationRepository.update(organizationId, {
      status: OrganizationStatus.ACTIVE,
    });
  }

  async getOrganizationStats(organizationId: string) {
    return this.organizationRepository.getStats(organizationId);
  }

  async checkLimits(organizationId: string, resource: 'wards' | 'dispatchers' | 'guardians'): Promise<{
    current: number;
    limit: number | null;
    canCreate: boolean;
  }> {
    const organization = await this.getOrganization(organizationId);
    const stats = await this.getOrganizationStats(organizationId);

    let current = 0;
    let limit: number | null = null;

    switch (resource) {
      case 'wards':
        current = stats.totalWards;
        limit = organization.maxWards || null;
        break;
      case 'dispatchers':
        current = stats.totalDispatchers;
        limit = organization.maxDispatchers || null;
        break;
      case 'guardians':
        current = stats.totalGuardians;
        limit = organization.maxGuardians || null;
        break;
    }

    return {
      current,
      limit,
      canCreate: limit === null || current < limit,
    };
  }

  private getDefaultFeatures(tier?: SubscriptionTier): Record<string, any> {
    const baseFeatures = {
      basic: {
        sos_button: true,
        fall_detection: false,
        ai_analytics: false,
        smp_integration: false,
        custom_branding: false,
        api_access: false,
        advanced_reports: false,
      },
      professional: {
        sos_button: true,
        fall_detection: true,
        ai_analytics: true,
        smp_integration: true,
        custom_branding: false,
        api_access: false,
        advanced_reports: true,
      },
      enterprise: {
        sos_button: true,
        fall_detection: true,
        ai_analytics: true,
        smp_integration: true,
        custom_branding: true,
        api_access: true,
        advanced_reports: true,
        white_label: true,
        dedicated_support: true,
      },
      custom: {
        sos_button: true,
        fall_detection: true,
        ai_analytics: true,
        smp_integration: true,
        custom_branding: true,
        api_access: true,
        advanced_reports: true,
        white_label: true,
        dedicated_support: true,
      },
    };

    return baseFeatures[tier || 'basic'];
  }

  private getDefaultSettings(): Record<string, any> {
    return {
      timezone: 'Europe/Moscow',
      locale: 'ru',
      dateFormat: 'DD.MM.YYYY',
      timeFormat: '24h',
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
    };
  }
}







