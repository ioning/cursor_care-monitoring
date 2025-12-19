import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SMPService } from '../../application/services/smp.service';
import { JwtAuthGuard } from '../../../../../shared/guards/jwt-auth.guard';

@ApiTags('dispatcher-smp')
@Controller('smp')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SMPController {
  constructor(private readonly smpService: SMPService) {}

  // SMP Providers
  @Get('providers')
  @ApiOperation({ summary: 'Get all SMP providers' })
  @ApiResponse({ status: 200, description: 'Providers retrieved successfully' })
  async getProviders(@Request() req: any, @Query('organizationId') organizationId?: string) {
    const orgId = organizationId || req.user?.organizationId;
    return this.smpService.getProviders(orgId);
  }

  @Get('providers/:id')
  @ApiOperation({ summary: 'Get SMP provider by ID' })
  @ApiResponse({ status: 200, description: 'Provider retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async getProvider(@Param('id') id: string) {
    return this.smpService.getProvider(id);
  }

  // Service Prices
  @Get('service-prices')
  @ApiOperation({ summary: 'Get all service prices' })
  @ApiResponse({ status: 200, description: 'Service prices retrieved successfully' })
  async getServicePrices(@Request() req: any, @Query('organizationId') organizationId?: string) {
    const orgId = organizationId || req.user?.organizationId;
    return this.smpService.getServicePrices(orgId);
  }

  @Get('service-prices/:serviceType')
  @ApiOperation({ summary: 'Get service price by type' })
  @ApiResponse({ status: 200, description: 'Service price retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Service price not found' })
  async getServicePrice(
    @Param('serviceType') serviceType: string,
    @Request() req: any,
    @Query('organizationId') organizationId?: string,
  ) {
    const orgId = organizationId || req.user?.organizationId;
    return this.smpService.getServicePrice(serviceType, orgId);
  }

  // SMP Calls
  @Get('calls')
  @ApiOperation({ summary: 'Get SMP calls' })
  @ApiResponse({ status: 200, description: 'SMP calls retrieved successfully' })
  async getSMPCalls(
    @Request() req: any,
    @Query('providerId') providerId?: string,
    @Query('callId') callId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const orgId = organizationId || req.user?.organizationId;
    return this.smpService.getSMPCalls({
      providerId,
      callId,
      from,
      to,
      status,
      organizationId: orgId,
    });
  }

  @Get('calls/:id')
  @ApiOperation({ summary: 'Get SMP call by ID' })
  @ApiResponse({ status: 200, description: 'SMP call retrieved successfully' })
  @ApiResponse({ status: 404, description: 'SMP call not found' })
  async getSMPCall(@Param('id') id: string) {
    return this.smpService.getSMPCall(id);
  }

  @Post('calls')
  @ApiOperation({ summary: 'Create SMP call' })
  @ApiResponse({ status: 201, description: 'SMP call created successfully' })
  async createSMPCall(
    @Request() req: any,
    @Body()
    body: {
      callId: string;
      smpProviderId: string;
      serviceType: string;
      quantity?: number;
      notes?: string;
      organizationId?: string;
    },
  ) {
    const orgId = body.organizationId || req.user?.organizationId;
    return this.smpService.createSMPCall({
      ...body,
      organizationId: orgId,
    });
  }

  @Put('calls/:id/status')
  @ApiOperation({ summary: 'Update SMP call status' })
  @ApiResponse({ status: 200, description: 'SMP call status updated successfully' })
  async updateSMPCallStatus(
    @Param('id') id: string,
    @Body() body: { status: string; completedAt?: string },
  ) {
    const completedAt = body.completedAt ? new Date(body.completedAt) : undefined;
    return this.smpService.updateSMPCallStatus(id, body.status, completedAt);
  }

  // Cost Summary
  @Get('cost-summary')
  @ApiOperation({ summary: 'Get cost summary by providers' })
  @ApiResponse({ status: 200, description: 'Cost summary retrieved successfully' })
  async getCostSummary(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('providerId') providerId?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const orgId = organizationId || req.user?.organizationId;
    return this.smpService.getCostSummary({
      from,
      to,
      providerId,
      organizationId: orgId,
    });
  }
}







