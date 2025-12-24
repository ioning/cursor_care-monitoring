import { Controller, Get, Post, Put, Body, Query, Request } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GatewayConfig } from '../config/gateway.config';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('billing')
@Controller('billing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(
    private readonly httpService: HttpService,
    private readonly gatewayConfig: GatewayConfig,
  ) {}

  @Get('subscription')
  @ApiOperation({ summary: 'Get user subscription' })
  async getSubscription(@Request() req: any) {
    const billingServiceUrl = this.gatewayConfig.getBillingServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${billingServiceUrl}/billing/subscription`, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Post('subscription')
  @ApiOperation({ summary: 'Create subscription' })
  async createSubscription(@Request() req: any, @Body() body: any) {
    const billingServiceUrl = this.gatewayConfig.getBillingServiceUrl();
    const response = await firstValueFrom(
      this.httpService.post(`${billingServiceUrl}/billing/subscription`, body, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Put('subscription/cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancelSubscription(@Request() req: any) {
    const billingServiceUrl = this.gatewayConfig.getBillingServiceUrl();
    const response = await firstValueFrom(
      this.httpService.put(`${billingServiceUrl}/billing/subscription/cancel`, {}, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get invoices' })
  async getInvoices(@Request() req: any, @Query() query: any) {
    const billingServiceUrl = this.gatewayConfig.getBillingServiceUrl();
    const response = await firstValueFrom(
      this.httpService.get(`${billingServiceUrl}/billing/invoices`, {
        params: query,
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }

  @Post('payments')
  @ApiOperation({ summary: 'Process payment' })
  async processPayment(@Request() req: any, @Body() body: any) {
    const billingServiceUrl = this.gatewayConfig.getBillingServiceUrl();
    const response = await firstValueFrom(
      this.httpService.post(`${billingServiceUrl}/billing/payments`, body, {
        headers: { Authorization: req.headers.authorization },
      }),
    );
    return response.data;
  }
}

