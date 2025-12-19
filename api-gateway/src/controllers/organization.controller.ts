import { Controller, Get, Post, Put, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GatewayConfig } from '../config/gateway.config';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { TenantGuard } from '../../../shared/guards/tenant.guard';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationController {
  constructor(
    private readonly httpService: HttpService,
    private readonly gatewayConfig: GatewayConfig,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create organization' })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  async createOrganization(@Body() body: any, @Request() req: any) {
    const url = `${this.gatewayConfig.getOrganizationServiceUrl()}/organizations`;
    const response = await firstValueFrom(this.httpService.post(url, body));
    return response.data;
  }

  @Get(':id')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Organization retrieved successfully' })
  async getOrganization(@Param('id') id: string, @Request() req: any) {
    const url = `${this.gatewayConfig.getOrganizationServiceUrl()}/organizations/${id}`;
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data;
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get organization by slug' })
  @ApiResponse({ status: 200, description: 'Organization retrieved successfully' })
  async getOrganizationBySlug(@Param('slug') slug: string) {
    const url = `${this.gatewayConfig.getOrganizationServiceUrl()}/organizations/slug/${slug}`;
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data;
  }

  @Put(':id')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
  async updateOrganization(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const url = `${this.gatewayConfig.getOrganizationServiceUrl()}/organizations/${id}`;
    const response = await firstValueFrom(this.httpService.put(url, body));
    return response.data;
  }

  @Get(':id/stats')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Get organization statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getOrganizationStats(@Param('id') id: string, @Request() req: any) {
    const url = `${this.gatewayConfig.getOrganizationServiceUrl()}/organizations/${id}/stats`;
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data;
  }

  @Get(':id/limits/:resource')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Check resource limits' })
  @ApiResponse({ status: 200, description: 'Limits retrieved successfully' })
  async checkLimits(
    @Param('id') id: string,
    @Param('resource') resource: string,
    @Request() req: any,
  ) {
    const url = `${this.gatewayConfig.getOrganizationServiceUrl()}/organizations/${id}/limits/${resource}`;
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data;
  }

  @Post(':id/subscription')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Update organization subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  async updateSubscription(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const url = `${this.gatewayConfig.getOrganizationServiceUrl()}/organizations/${id}/subscription`;
    const response = await firstValueFrom(this.httpService.post(url, body));
    return response.data;
  }
}
