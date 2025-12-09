import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from '../../application/services/billing.service';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';

@ApiTags('billing')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @ApiOperation({ summary: 'Get user subscription' })
  @ApiResponse({ status: 200, description: 'Subscription retrieved successfully' })
  async getSubscription(@Request() req) {
    return this.billingService.getSubscription(req.user.id);
  }

  @Post('subscription')
  @ApiOperation({ summary: 'Create subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  async createSubscription(@Request() req, @Body() body: { planId: string }) {
    return this.billingService.createSubscription(req.user.id, body.planId);
  }

  @Put('subscription/cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  async cancelSubscription(@Request() req) {
    return this.billingService.cancelSubscription(req.user.id);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get invoices' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  async getInvoices(@Request() req, @Query() query: any) {
    return this.billingService.getInvoices(req.user.id, query);
  }

  @Post('payments')
  @ApiOperation({ summary: 'Create payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  async createPayment(@Request() req, @Body() body: any) {
    return this.billingService.processPayment(req.user.id, body);
  }

  @Get('payments/:id/status')
  @ApiOperation({ summary: 'Get payment status' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  async getPaymentStatus(@Request() req, @Param('id') id: string) {
    return this.billingService.getPaymentStatus(id);
  }
}


  @ApiOperation({ summary: 'Get payment status' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  async getPaymentStatus(@Request() req, @Param('id') id: string) {
    return this.billingService.getPaymentStatus(id);
  }
}


  @ApiOperation({ summary: 'Get payment status' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  async getPaymentStatus(@Request() req, @Param('id') id: string) {
    return this.billingService.getPaymentStatus(id);
  }
}

