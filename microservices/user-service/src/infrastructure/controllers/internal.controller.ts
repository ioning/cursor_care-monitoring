import { Controller, Get, Param, Headers } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FamilyAccessService } from '../../application/services/family-access.service';
import { WardService } from '../../application/services/ward.service';
import { createLogger } from '../../../../../shared/libs/logger';

@ApiTags('internal')
@Controller('internal')
export class InternalController {
  private readonly logger = createLogger({ serviceName: 'user-service' });

  constructor(
    private readonly familyAccessService: FamilyAccessService,
    private readonly wardService: WardService,
  ) {}

  /**
   * Internal endpoint for service-to-service calls
   * Get all guardians for a ward without authentication
   * Protected by service token check (X-Internal-Service header)
   */
  @Get('wards/:wardId/guardians')
  @ApiOperation({ summary: '[Internal] Get all guardians for ward' })
  @ApiResponse({ status: 200, description: 'Guardians retrieved successfully' })
  async getGuardiansForWard(
    @Param('wardId') wardId: string,
    @Headers('x-internal-service') serviceName?: string,
  ) {
    // Basic service-to-service authentication check
    // In production, you might want to validate service token or IP whitelist
    const allowedServices = ['integration-service', 'alert-service', 'dispatcher-service'];
    if (serviceName && !allowedServices.includes(serviceName.toLowerCase())) {
      this.logger.warn('Unauthorized internal service call', { serviceName, wardId });
      throw new Error('Unauthorized internal service call');
    }

    try {
      // Skip access check for internal calls - service-to-service trust
      const guardians = await this.familyAccessService.getGuardiansForWardInternal(wardId);
      
      return {
        success: true,
        data: guardians,
      };
    } catch (error: any) {
      this.logger.error('Failed to get guardians for ward (internal)', {
        wardId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Internal endpoint to check if user has access to ward
   */
  @Get('wards/:wardId/access/:userId')
  @ApiOperation({ summary: '[Internal] Check user access to ward' })
  @ApiResponse({ status: 200, description: 'Access check result' })
  async checkAccessToWard(
    @Param('wardId') wardId: string,
    @Param('userId') userId: string,
    @Headers('x-internal-service') serviceName?: string,
  ) {
    const allowedServices = ['alert-service', 'integration-service', 'dispatcher-service', 'telemetry-service', 'location-service'];
    if (serviceName && !allowedServices.includes(serviceName.toLowerCase())) {
      this.logger.warn('Unauthorized internal service call', { serviceName, wardId, userId });
      throw new Error('Unauthorized internal service call');
    }

    try {
      const hasAccess = await this.familyAccessService.hasAccessToWardInternal(userId, wardId);
      return {
        success: true,
        data: {
          hasAccess,
          userId,
          wardId,
        },
      };
    } catch (error: any) {
      this.logger.error('Failed to check access to ward (internal)', {
        wardId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Internal endpoint to get ward by ID
   */
  @Get('wards/:wardId')
  @ApiOperation({ summary: '[Internal] Get ward by ID' })
  @ApiResponse({ status: 200, description: 'Ward retrieved successfully' })
  async getWardById(
    @Param('wardId') wardId: string,
    @Headers('x-internal-service') serviceName?: string,
  ) {
    const allowedServices = ['alert-service', 'integration-service', 'dispatcher-service', 'telemetry-service', 'location-service'];
    if (serviceName && !allowedServices.includes(serviceName.toLowerCase())) {
      this.logger.warn('Unauthorized internal service call', { serviceName, wardId });
      throw new Error('Unauthorized internal service call');
    }

    try {
      // For internal calls, skip access check - dispatchers have access to all wards
      const ward = await this.wardService.getByIdInternal(wardId);
      
      if (!ward) {
        return {
          success: false,
          data: null,
          message: 'Ward not found',
        };
      }

      return {
        success: true,
        data: ward,
      };
    } catch (error: any) {
      this.logger.error('Failed to get ward (internal)', {
        wardId,
        error: error.message,
      });
      throw error;
    }
  }
}

