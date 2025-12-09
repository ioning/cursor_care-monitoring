import { Injectable, NotFoundException } from '@nestjs/common';
import { SMPProviderRepository, SMPProvider } from '../../infrastructure/repositories/smp-provider.repository';
import { ServicePriceRepository, ServicePrice } from '../../infrastructure/repositories/service-price.repository';
import { SMPCallRepository, SMPCall, SMPCostSummary } from '../../infrastructure/repositories/smp-call.repository';

@Injectable()
export class SMPService {
  constructor(
    private readonly smpProviderRepository: SMPProviderRepository,
    private readonly servicePriceRepository: ServicePriceRepository,
    private readonly smpCallRepository: SMPCallRepository,
  ) {}

  // SMP Providers
  async getProviders(organizationId?: string): Promise<SMPProvider[]> {
    return this.smpProviderRepository.findAll(organizationId);
  }

  async getProvider(providerId: string): Promise<SMPProvider> {
    const provider = await this.smpProviderRepository.findById(providerId);
    if (!provider) {
      throw new NotFoundException(`SMP provider with ID ${providerId} not found`);
    }
    return provider;
  }

  async getActiveProviders(organizationId?: string): Promise<SMPProvider[]> {
    return this.smpProviderRepository.findActive(organizationId);
  }

  async createProvider(provider: Omit<SMPProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<SMPProvider> {
    return this.smpProviderRepository.create(provider);
  }

  async updateProvider(providerId: string, updates: Partial<SMPProvider>): Promise<SMPProvider> {
    const provider = await this.smpProviderRepository.findById(providerId);
    if (!provider) {
      throw new NotFoundException(`SMP provider with ID ${providerId} not found`);
    }
    return this.smpProviderRepository.update(providerId, updates);
  }

  // Service Prices
  async getServicePrices(organizationId?: string): Promise<ServicePrice[]> {
    return this.servicePriceRepository.findAll(organizationId);
  }

  async getServicePrice(serviceType: string, organizationId?: string): Promise<ServicePrice> {
    const price = await this.servicePriceRepository.findByType(serviceType, organizationId);
    if (!price) {
      throw new NotFoundException(`Service price for type ${serviceType} not found`);
    }
    return price;
  }

  async getActiveServicePrices(organizationId?: string): Promise<ServicePrice[]> {
    return this.servicePriceRepository.findActive(organizationId);
  }

  async createServicePrice(price: Omit<ServicePrice, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServicePrice> {
    return this.servicePriceRepository.create(price);
  }

  async updateServicePrice(priceId: string, updates: Partial<ServicePrice>): Promise<ServicePrice> {
    return this.servicePriceRepository.update(priceId, updates);
  }

  // SMP Calls
  async getSMPCalls(filters: {
    providerId?: string;
    callId?: string;
    from?: string;
    to?: string;
    status?: string;
    organizationId?: string;
  }): Promise<SMPCall[]> {
    const fromDate = filters.from ? new Date(filters.from) : undefined;
    const toDate = filters.to ? new Date(filters.to) : undefined;

    return this.smpCallRepository.find({
      providerId: filters.providerId,
      callId: filters.callId,
      from: fromDate,
      to: toDate,
      status: filters.status,
      organizationId: filters.organizationId,
    });
  }

  async getSMPCall(smpCallId: string): Promise<SMPCall> {
    const smpCall = await this.smpCallRepository.findById(smpCallId);
    if (!smpCall) {
      throw new NotFoundException(`SMP call with ID ${smpCallId} not found`);
    }
    return smpCall;
  }

  async createSMPCall(data: {
    callId: string;
    smpProviderId: string;
    serviceType: string;
    quantity?: number;
    notes?: string;
    organizationId?: string;
  }): Promise<SMPCall> {
    // Get service price
    const servicePrice = await this.servicePriceRepository.findByType(data.serviceType, data.organizationId);
    if (!servicePrice) {
      throw new NotFoundException(`Service price for type ${data.serviceType} not found`);
    }

    // Verify provider exists
    const provider = await this.smpProviderRepository.findById(data.smpProviderId);
    if (!provider) {
      throw new NotFoundException(`SMP provider with ID ${data.smpProviderId} not found`);
    }

    const quantity = data.quantity || 1.0;
    const totalPrice = servicePrice.basePrice * quantity;

    return this.smpCallRepository.create({
      callId: data.callId,
      smpProviderId: data.smpProviderId,
      serviceType: data.serviceType,
      quantity,
      unitPrice: servicePrice.basePrice,
      totalPrice,
      currency: servicePrice.currency,
      status: 'pending',
      calledAt: new Date(),
      notes: data.notes,
      organizationId: data.organizationId,
    });
  }

  async updateSMPCallStatus(smpCallId: string, status: string, completedAt?: Date): Promise<SMPCall> {
    const smpCall = await this.smpCallRepository.findById(smpCallId);
    if (!smpCall) {
      throw new NotFoundException(`SMP call with ID ${smpCallId} not found`);
    }

    const finalCompletedAt = status === 'completed' && !completedAt ? new Date() : completedAt;
    return this.smpCallRepository.updateStatus(smpCallId, status, finalCompletedAt);
  }

  // Cost Summary
  async getCostSummary(filters: {
    from?: string;
    to?: string;
    providerId?: string;
    organizationId?: string;
  }): Promise<{
    totalProviders: number;
    activeProviders: number;
    totalCalls: number;
    totalCost: number;
    period: {
      from: string;
      to: string;
    };
    byProvider: SMPCostSummary[];
  }> {
    const fromDate = filters.from ? new Date(filters.from) : undefined;
    const toDate = filters.to ? new Date(filters.to) : undefined;

    // Get all providers for counts
    const allProviders = await this.smpProviderRepository.findAll(filters.organizationId);
    const activeProviders = allProviders.filter((p) => p.isActive);

    // Get cost summary
    const byProvider = await this.smpCallRepository.getCostSummary({
      from: fromDate,
      to: toDate,
      providerId: filters.providerId,
      organizationId: filters.organizationId,
    });

    const totalCalls = byProvider.reduce((sum, p) => sum + p.totalCalls, 0);
    const totalCost = byProvider.reduce((sum, p) => sum + p.totalCost, 0);

    // Determine period
    let periodFrom: Date;
    let periodTo: Date;

    if (fromDate && toDate) {
      periodFrom = fromDate;
      periodTo = toDate;
    } else if (byProvider.length > 0) {
      periodFrom = byProvider.reduce((earliest, p) => 
        p.period.from < earliest ? p.period.from : earliest, 
        byProvider[0].period.from
      );
      periodTo = byProvider.reduce((latest, p) => 
        p.period.to > latest ? p.period.to : latest, 
        byProvider[0].period.to
      );
    } else {
      const now = new Date();
      periodFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      periodTo = now;
    }

    return {
      totalProviders: allProviders.length,
      activeProviders: activeProviders.length,
      totalCalls,
      totalCost,
      period: {
        from: periodFrom.toISOString(),
        to: periodTo.toISOString(),
      },
      byProvider,
    };
  }
}


import { SMPProviderRepository, SMPProvider } from '../../infrastructure/repositories/smp-provider.repository';
import { ServicePriceRepository, ServicePrice } from '../../infrastructure/repositories/service-price.repository';
import { SMPCallRepository, SMPCall, SMPCostSummary } from '../../infrastructure/repositories/smp-call.repository';

@Injectable()
export class SMPService {
  constructor(
    private readonly smpProviderRepository: SMPProviderRepository,
    private readonly servicePriceRepository: ServicePriceRepository,
    private readonly smpCallRepository: SMPCallRepository,
  ) {}

  // SMP Providers
  async getProviders(organizationId?: string): Promise<SMPProvider[]> {
    return this.smpProviderRepository.findAll(organizationId);
  }

  async getProvider(providerId: string): Promise<SMPProvider> {
    const provider = await this.smpProviderRepository.findById(providerId);
    if (!provider) {
      throw new NotFoundException(`SMP provider with ID ${providerId} not found`);
    }
    return provider;
  }

  async getActiveProviders(organizationId?: string): Promise<SMPProvider[]> {
    return this.smpProviderRepository.findActive(organizationId);
  }

  async createProvider(provider: Omit<SMPProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<SMPProvider> {
    return this.smpProviderRepository.create(provider);
  }

  async updateProvider(providerId: string, updates: Partial<SMPProvider>): Promise<SMPProvider> {
    const provider = await this.smpProviderRepository.findById(providerId);
    if (!provider) {
      throw new NotFoundException(`SMP provider with ID ${providerId} not found`);
    }
    return this.smpProviderRepository.update(providerId, updates);
  }

  // Service Prices
  async getServicePrices(organizationId?: string): Promise<ServicePrice[]> {
    return this.servicePriceRepository.findAll(organizationId);
  }

  async getServicePrice(serviceType: string, organizationId?: string): Promise<ServicePrice> {
    const price = await this.servicePriceRepository.findByType(serviceType, organizationId);
    if (!price) {
      throw new NotFoundException(`Service price for type ${serviceType} not found`);
    }
    return price;
  }

  async getActiveServicePrices(organizationId?: string): Promise<ServicePrice[]> {
    return this.servicePriceRepository.findActive(organizationId);
  }

  async createServicePrice(price: Omit<ServicePrice, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServicePrice> {
    return this.servicePriceRepository.create(price);
  }

  async updateServicePrice(priceId: string, updates: Partial<ServicePrice>): Promise<ServicePrice> {
    return this.servicePriceRepository.update(priceId, updates);
  }

  // SMP Calls
  async getSMPCalls(filters: {
    providerId?: string;
    callId?: string;
    from?: string;
    to?: string;
    status?: string;
    organizationId?: string;
  }): Promise<SMPCall[]> {
    const fromDate = filters.from ? new Date(filters.from) : undefined;
    const toDate = filters.to ? new Date(filters.to) : undefined;

    return this.smpCallRepository.find({
      providerId: filters.providerId,
      callId: filters.callId,
      from: fromDate,
      to: toDate,
      status: filters.status,
      organizationId: filters.organizationId,
    });
  }

  async getSMPCall(smpCallId: string): Promise<SMPCall> {
    const smpCall = await this.smpCallRepository.findById(smpCallId);
    if (!smpCall) {
      throw new NotFoundException(`SMP call with ID ${smpCallId} not found`);
    }
    return smpCall;
  }

  async createSMPCall(data: {
    callId: string;
    smpProviderId: string;
    serviceType: string;
    quantity?: number;
    notes?: string;
    organizationId?: string;
  }): Promise<SMPCall> {
    // Get service price
    const servicePrice = await this.servicePriceRepository.findByType(data.serviceType, data.organizationId);
    if (!servicePrice) {
      throw new NotFoundException(`Service price for type ${data.serviceType} not found`);
    }

    // Verify provider exists
    const provider = await this.smpProviderRepository.findById(data.smpProviderId);
    if (!provider) {
      throw new NotFoundException(`SMP provider with ID ${data.smpProviderId} not found`);
    }

    const quantity = data.quantity || 1.0;
    const totalPrice = servicePrice.basePrice * quantity;

    return this.smpCallRepository.create({
      callId: data.callId,
      smpProviderId: data.smpProviderId,
      serviceType: data.serviceType,
      quantity,
      unitPrice: servicePrice.basePrice,
      totalPrice,
      currency: servicePrice.currency,
      status: 'pending',
      calledAt: new Date(),
      notes: data.notes,
      organizationId: data.organizationId,
    });
  }

  async updateSMPCallStatus(smpCallId: string, status: string, completedAt?: Date): Promise<SMPCall> {
    const smpCall = await this.smpCallRepository.findById(smpCallId);
    if (!smpCall) {
      throw new NotFoundException(`SMP call with ID ${smpCallId} not found`);
    }

    const finalCompletedAt = status === 'completed' && !completedAt ? new Date() : completedAt;
    return this.smpCallRepository.updateStatus(smpCallId, status, finalCompletedAt);
  }

  // Cost Summary
  async getCostSummary(filters: {
    from?: string;
    to?: string;
    providerId?: string;
    organizationId?: string;
  }): Promise<{
    totalProviders: number;
    activeProviders: number;
    totalCalls: number;
    totalCost: number;
    period: {
      from: string;
      to: string;
    };
    byProvider: SMPCostSummary[];
  }> {
    const fromDate = filters.from ? new Date(filters.from) : undefined;
    const toDate = filters.to ? new Date(filters.to) : undefined;

    // Get all providers for counts
    const allProviders = await this.smpProviderRepository.findAll(filters.organizationId);
    const activeProviders = allProviders.filter((p) => p.isActive);

    // Get cost summary
    const byProvider = await this.smpCallRepository.getCostSummary({
      from: fromDate,
      to: toDate,
      providerId: filters.providerId,
      organizationId: filters.organizationId,
    });

    const totalCalls = byProvider.reduce((sum, p) => sum + p.totalCalls, 0);
    const totalCost = byProvider.reduce((sum, p) => sum + p.totalCost, 0);

    // Determine period
    let periodFrom: Date;
    let periodTo: Date;

    if (fromDate && toDate) {
      periodFrom = fromDate;
      periodTo = toDate;
    } else if (byProvider.length > 0) {
      periodFrom = byProvider.reduce((earliest, p) => 
        p.period.from < earliest ? p.period.from : earliest, 
        byProvider[0].period.from
      );
      periodTo = byProvider.reduce((latest, p) => 
        p.period.to > latest ? p.period.to : latest, 
        byProvider[0].period.to
      );
    } else {
      const now = new Date();
      periodFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      periodTo = now;
    }

    return {
      totalProviders: allProviders.length,
      activeProviders: activeProviders.length,
      totalCalls,
      totalCost,
      period: {
        from: periodFrom.toISOString(),
        to: periodTo.toISOString(),
      },
      byProvider,
    };
  }
}







