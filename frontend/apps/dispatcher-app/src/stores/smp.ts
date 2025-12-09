import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { smpApi, type SMPProvider, type ServicePrice, type SMPCall, type SMPStats } from '../api/smp.api';

export const useSMPStore = defineStore('smp', () => {
  const providers = ref<SMPProvider[]>([]);
  const servicePrices = ref<ServicePrice[]>([]);
  const smpCalls = ref<SMPCall[]>([]);
  const stats = ref<SMPStats | null>(null);
  const isLoading = ref(false);

  const activeProviders = computed(() =>
    providers.value.filter((p) => p.isActive)
  );

  const servicePriceMap = computed(() => {
    const map = new Map<string, ServicePrice>();
    servicePrices.value.forEach((price) => {
      map.set(price.serviceType, price);
    });
    return map;
  });

  async function fetchProviders() {
    isLoading.value = true;
    try {
      const data = await smpApi.getProviders();
      providers.value = data;
    } catch (error) {
      console.error('Failed to fetch SMP providers:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchServicePrices() {
    isLoading.value = true;
    try {
      const data = await smpApi.getServicePrices();
      servicePrices.value = data;
    } catch (error) {
      console.error('Failed to fetch service prices:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchSMPCalls(filters?: {
    providerId?: string;
    callId?: string;
    from?: string;
    to?: string;
    status?: string;
  }) {
    isLoading.value = true;
    try {
      const data = await smpApi.getSMPCalls(filters);
      smpCalls.value = data;
    } catch (error) {
      console.error('Failed to fetch SMP calls:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchCostSummary(filters?: {
    from?: string;
    to?: string;
    providerId?: string;
  }) {
    isLoading.value = true;
    try {
      const data = await smpApi.getCostSummary(filters);
      stats.value = data;
    } catch (error) {
      console.error('Failed to fetch cost summary:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function createSMPCall(callId: string, data: {
    smpProviderId: string;
    serviceType: string;
    quantity?: number;
    notes?: string;
  }) {
    try {
      const call = await smpApi.createSMPCall(callId, data);
      smpCalls.value.push(call);
      return call;
    } catch (error) {
      console.error('Failed to create SMP call:', error);
      throw error;
    }
  }

  function getServicePrice(serviceType: string): ServicePrice | undefined {
    return servicePriceMap.value.get(serviceType);
  }

  return {
    providers,
    servicePrices,
    smpCalls,
    stats,
    isLoading,
    activeProviders,
    servicePriceMap,
    fetchProviders,
    fetchServicePrices,
    fetchSMPCalls,
    fetchCostSummary,
    createSMPCall,
    getServicePrice,
  };
});


import { ref, computed } from 'vue';
import { smpApi, type SMPProvider, type ServicePrice, type SMPCall, type SMPStats } from '../api/smp.api';

export const useSMPStore = defineStore('smp', () => {
  const providers = ref<SMPProvider[]>([]);
  const servicePrices = ref<ServicePrice[]>([]);
  const smpCalls = ref<SMPCall[]>([]);
  const stats = ref<SMPStats | null>(null);
  const isLoading = ref(false);

  const activeProviders = computed(() =>
    providers.value.filter((p) => p.isActive)
  );

  const servicePriceMap = computed(() => {
    const map = new Map<string, ServicePrice>();
    servicePrices.value.forEach((price) => {
      map.set(price.serviceType, price);
    });
    return map;
  });

  async function fetchProviders() {
    isLoading.value = true;
    try {
      const data = await smpApi.getProviders();
      providers.value = data;
    } catch (error) {
      console.error('Failed to fetch SMP providers:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchServicePrices() {
    isLoading.value = true;
    try {
      const data = await smpApi.getServicePrices();
      servicePrices.value = data;
    } catch (error) {
      console.error('Failed to fetch service prices:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchSMPCalls(filters?: {
    providerId?: string;
    callId?: string;
    from?: string;
    to?: string;
    status?: string;
  }) {
    isLoading.value = true;
    try {
      const data = await smpApi.getSMPCalls(filters);
      smpCalls.value = data;
    } catch (error) {
      console.error('Failed to fetch SMP calls:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchCostSummary(filters?: {
    from?: string;
    to?: string;
    providerId?: string;
  }) {
    isLoading.value = true;
    try {
      const data = await smpApi.getCostSummary(filters);
      stats.value = data;
    } catch (error) {
      console.error('Failed to fetch cost summary:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function createSMPCall(callId: string, data: {
    smpProviderId: string;
    serviceType: string;
    quantity?: number;
    notes?: string;
  }) {
    try {
      const call = await smpApi.createSMPCall(callId, data);
      smpCalls.value.push(call);
      return call;
    } catch (error) {
      console.error('Failed to create SMP call:', error);
      throw error;
    }
  }

  function getServicePrice(serviceType: string): ServicePrice | undefined {
    return servicePriceMap.value.get(serviceType);
  }

  return {
    providers,
    servicePrices,
    smpCalls,
    stats,
    isLoading,
    activeProviders,
    servicePriceMap,
    fetchProviders,
    fetchServicePrices,
    fetchSMPCalls,
    fetchCostSummary,
    createSMPCall,
    getServicePrice,
  };
});







