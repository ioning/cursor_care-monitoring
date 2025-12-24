import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationService } from '../../application/services/organization.service';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';
import { TenantGuard } from '../../../../../shared/guards/tenant.guard';
import { SubscriptionTier, OrganizationStatus } from '../../../../../shared/types/common.types';

@ApiTags('organizations')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @ApiOperation({ summary: 'Create new organization' })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  async createOrganization(
    @Body()
    body: {
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
    },
  ) {
    if (!body.name || !body.slug) {
      throw new BadRequestException('Name and slug are required');
    }

    const organization = await this.organizationService.createOrganization(body);

    return {
      success: true,
      data: organization,
      message: 'Organization created successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Organization retrieved successfully' })
  async getOrganization(@Param('id') id: string) {
    const organization = await this.organizationService.getOrganization(id);

    return {
      success: true,
      data: organization,
    };
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get organization by slug' })
  @ApiResponse({ status: 200, description: 'Organization retrieved successfully' })
  async getOrganizationBySlug(@Param('slug') slug: string) {
    const organization = await this.organizationService.getOrganizationBySlug(slug);

    return {
      success: true,
      data: organization,
    };
  }

  @Get('serial-number/:serialNumber')
  @ApiOperation({ summary: 'Get organization by device serial number' })
  @ApiResponse({ status: 200, description: 'Organization retrieved successfully' })
  async getOrganizationBySerialNumber(@Param('serialNumber') serialNumber: string) {
    const organization = await this.organizationService.getOrganizationBySerialNumber(serialNumber);

    return {
      success: true,
      data: organization,
    };
  }

  @Put(':id')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
  async updateOrganization(
    @Param('id') id: string,
    @Request() req: any,
    @Body()
    body: {
      name?: string;
      description?: string;
      status?: OrganizationStatus;
      maxWards?: number;
      maxDispatchers?: number;
      maxGuardians?: number;
      settings?: Record<string, any>;
    },
  ) {
    // Проверка, что пользователь имеет право обновлять эту организацию
    if (req.user.organizationId !== id && req.user.role !== 'admin') {
      throw new BadRequestException('Access denied');
    }

    const organization = await this.organizationService.updateOrganization(id, body);

    return {
      success: true,
      data: organization,
      message: 'Organization updated successfully',
    };
  }

  @Get(':id/stats')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Get organization statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getOrganizationStats(@Param('id') id: string, @Request() req: any) {
    if (req.user.organizationId !== id && req.user.role !== 'admin') {
      throw new BadRequestException('Access denied');
    }

    const stats = await this.organizationService.getOrganizationStats(id);

    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id/limits/:resource')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Check resource limits' })
  @ApiResponse({ status: 200, description: 'Limits retrieved successfully' })
  async checkLimits(
    @Param('id') id: string,
    @Param('resource') resource: 'wards' | 'dispatchers' | 'guardians',
    @Request() req: any,
  ) {
    if (req.user.organizationId !== id && req.user.role !== 'admin') {
      throw new BadRequestException('Access denied');
    }

    const limits = await this.organizationService.checkLimits(id, resource);

    return {
      success: true,
      data: limits,
    };
  }

  @Post(':id/subscription')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Update organization subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  async updateSubscription(
    @Param('id') id: string,
    @Request() req: any,
    @Body()
    body: {
      subscriptionTier: SubscriptionTier;
      planId?: string;
    },
  ) {
    // Только админы системы или организации могут менять подписку
    if (req.user.role !== 'admin' && req.user.role !== 'organization_admin') {
      throw new BadRequestException('Access denied');
    }

    const organization = await this.organizationService.updateSubscription(
      id,
      body.subscriptionTier,
      body.planId,
    );

    return {
      success: true,
      data: organization,
      message: 'Subscription updated successfully',
    };
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend organization' })
  @ApiResponse({ status: 200, description: 'Organization suspended successfully' })
  async suspendOrganization(@Param('id') id: string, @Request() req: any) {
    // Только системные админы могут приостанавливать организации
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Access denied');
    }

    const organization = await this.organizationService.suspendOrganization(id);

    return {
      success: true,
      data: organization,
      message: 'Organization suspended successfully',
    };
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate organization' })
  @ApiResponse({ status: 200, description: 'Organization activated successfully' })
  async activateOrganization(@Param('id') id: string, @Request() req: any) {
    // Только системные админы могут активировать организации
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Access denied');
    }

    const organization = await this.organizationService.activateOrganization(id);

    return {
      success: true,
      data: organization,
      message: 'Organization activated successfully',
    };
  }
}







