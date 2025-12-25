import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createLogger } from '../../../../../shared/libs/logger';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  deviceSerialNumbers?: string[];
}

@Injectable()
export class OrganizationServiceClient {
  private readonly logger = createLogger({ serviceName: 'device-service' });
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = process.env.ORGANIZATION_SERVICE_URL || 'http://localhost:3012';
  }

  /**
   * Get organization by device serial number
   * Returns primary organization if not found
   */
  async getOrganizationBySerialNumber(serialNumber: string): Promise<Organization> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ success: boolean; data: Organization }>(
          `${this.baseUrl}/organizations/serial-number/${encodeURIComponent(serialNumber)}`,
          {
            timeout: 5000,
          },
        ),
      ) as { data: { success: boolean; data: Organization } };

      if (response.data.success && response.data.data) {
        this.logger.info(`Organization found for serial number: ${serialNumber}`, {
          organizationId: response.data.data.id,
          organizationName: response.data.data.name,
        });
        return response.data.data;
      }

      // Fallback to primary organization
      return this.getPrimaryOrganization();
    } catch (error: any) {
      this.logger.warn(`Failed to get organization by serial number: ${serialNumber}`, {
        error: error.message,
        status: error.response?.status,
      });
      // Fallback to primary organization on error
      return this.getPrimaryOrganization();
    }
  }

  /**
   * Get primary organization (default for unassigned devices)
   */
  async getPrimaryOrganization(): Promise<Organization> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ success: boolean; data: Organization }>(
          `${this.baseUrl}/organizations/slug/primary`,
          {
            timeout: 5000,
          },
        ),
      ) as { data: { success: boolean; data: Organization } };

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Primary organization not found');
    } catch (error: any) {
      this.logger.error('Failed to get primary organization', {
        error: error.message,
        status: error.response?.status,
      });
      // Return a fallback organization ID (the default UUID from migration)
      return {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Primary Organization',
        slug: 'primary',
        deviceSerialNumbers: [],
      };
    }
  }
}

