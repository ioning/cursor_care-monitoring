import apiClient from './client';

export interface SMPProvider {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  contractNumber?: string;
  contractDate?: string;
  isActive: boolean;
  serviceArea?: string;
  rating?: number;
}

export interface ServicePrice {
  id: string;
  serviceType: string;
  serviceName: string;
  basePrice: number;
  currency: string;
  unit: string; // 'per_call', 'per_hour', 'per_km', etc.
  description?: string;
  isActive: boolean;
}

export interface SMPCall {
  id: string;
  callId: string;
  smpProviderId: string;
  serviceType: string;
  quantity?: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  calledAt: string;
  completedAt?: string;
  notes?: string;
  smpProvider?: SMPProvider;
}

export interface SMPCostSummary {
  providerId: string;
  providerName: string;
  totalCalls: number;
  totalCost: number;
  currency: string;
  period: {
    from: string;
    to: string;
  };
  byServiceType: Record<string, {
    count: number;
    cost: number;
  }>;
}

export interface SMPStats {
  totalProviders: number;
  activeProviders: number;
  totalCalls: number;
  totalCost: number;
  period: {
    from: string;
    to: string;
  };
  byProvider: SMPCostSummary[];
}

export const smpApi = {
  async getProviders(): Promise<SMPProvider[]> {
    const response = await apiClient.get('/dispatcher/smp/providers');
    return response.data;
  },

  async getProvider(providerId: string): Promise<SMPProvider> {
    const response = await apiClient.get(`/dispatcher/smp/providers/${providerId}`);
    return response.data;
  },

  async getServicePrices(): Promise<ServicePrice[]> {
    const response = await apiClient.get('/dispatcher/smp/service-prices');
    return response.data;
  },

  async getServicePrice(serviceType: string): Promise<ServicePrice> {
    const response = await apiClient.get(`/dispatcher/smp/service-prices/${serviceType}`);
    return response.data;
  },

  async getSMPCalls(filters?: {
    providerId?: string;
    callId?: string;
    from?: string;
    to?: string;
    status?: string;
  }): Promise<SMPCall[]> {
    const response = await apiClient.get('/dispatcher/smp/calls', { params: filters });
    return response.data;
  },

  async getCostSummary(filters?: {
    from?: string;
    to?: string;
    providerId?: string;
  }): Promise<SMPStats> {
    const response = await apiClient.get('/dispatcher/smp/cost-summary', { params: filters });
    return response.data;
  },

  async createSMPCall(callId: string, data: {
    smpProviderId: string;
    serviceType: string;
    quantity?: number;
    notes?: string;
  }): Promise<SMPCall> {
    const response = await apiClient.post(`/dispatcher/smp/calls`, {
      callId,
      ...data,
    });
    return response.data;
  },
};



export interface SMPProvider {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  contractNumber?: string;
  contractDate?: string;
  isActive: boolean;
  serviceArea?: string;
  rating?: number;
}

export interface ServicePrice {
  id: string;
  serviceType: string;
  serviceName: string;
  basePrice: number;
  currency: string;
  unit: string; // 'per_call', 'per_hour', 'per_km', etc.
  description?: string;
  isActive: boolean;
}

export interface SMPCall {
  id: string;
  callId: string;
  smpProviderId: string;
  serviceType: string;
  quantity?: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  calledAt: string;
  completedAt?: string;
  notes?: string;
  smpProvider?: SMPProvider;
}

export interface SMPCostSummary {
  providerId: string;
  providerName: string;
  totalCalls: number;
  totalCost: number;
  currency: string;
  period: {
    from: string;
    to: string;
  };
  byServiceType: Record<string, {
    count: number;
    cost: number;
  }>;
}

export interface SMPStats {
  totalProviders: number;
  activeProviders: number;
  totalCalls: number;
  totalCost: number;
  period: {
    from: string;
    to: string;
  };
  byProvider: SMPCostSummary[];
}

export const smpApi = {
  async getProviders(): Promise<SMPProvider[]> {
    const response = await apiClient.get('/dispatcher/smp/providers');
    return response.data;
  },

  async getProvider(providerId: string): Promise<SMPProvider> {
    const response = await apiClient.get(`/dispatcher/smp/providers/${providerId}`);
    return response.data;
  },

  async getServicePrices(): Promise<ServicePrice[]> {
    const response = await apiClient.get('/dispatcher/smp/service-prices');
    return response.data;
  },

  async getServicePrice(serviceType: string): Promise<ServicePrice> {
    const response = await apiClient.get(`/dispatcher/smp/service-prices/${serviceType}`);
    return response.data;
  },

  async getSMPCalls(filters?: {
    providerId?: string;
    callId?: string;
    from?: string;
    to?: string;
    status?: string;
  }): Promise<SMPCall[]> {
    const response = await apiClient.get('/dispatcher/smp/calls', { params: filters });
    return response.data;
  },

  async getCostSummary(filters?: {
    from?: string;
    to?: string;
    providerId?: string;
  }): Promise<SMPStats> {
    const response = await apiClient.get('/dispatcher/smp/cost-summary', { params: filters });
    return response.data;
  },

  async createSMPCall(callId: string, data: {
    smpProviderId: string;
    serviceType: string;
    quantity?: number;
    notes?: string;
  }): Promise<SMPCall> {
    const response = await apiClient.post(`/dispatcher/smp/calls`, {
      callId,
      ...data,
    });
    return response.data;
  },
};







