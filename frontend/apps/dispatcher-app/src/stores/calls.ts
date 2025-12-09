import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { dispatcherApi, type EmergencyCall, type CallFilters } from '../api/dispatcher.api';

export const useCallsStore = defineStore('calls', () => {
  const calls = ref<EmergencyCall[]>([]);
  const selectedCall = ref<EmergencyCall | null>(null);
  const filters = ref<CallFilters>({
    page: 1,
    limit: 20,
  });
  const total = ref(0);
  const isLoading = ref(false);
  const stats = ref({
    total: 0,
    byStatus: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
  });

  const activeCalls = computed(() =>
    calls.value.filter((call) => 
      call.status !== 'resolved' && call.status !== 'canceled'
    )
  );

  const criticalCalls = computed(() =>
    calls.value.filter((call) => call.priority === 'critical' && call.status !== 'resolved')
  );

  async function fetchCalls(newFilters?: CallFilters) {
    isLoading.value = true;
    try {
      if (newFilters) {
        filters.value = { ...filters.value, ...newFilters };
      }
      const response = await dispatcherApi.getCalls(filters.value);
      calls.value = response.calls || [];
      total.value = response.total || 0;
    } catch (error) {
      console.error('Failed to fetch calls:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchCall(callId: string) {
    isLoading.value = true;
    try {
      const call = await dispatcherApi.getCall(callId);
      selectedCall.value = call;
      
      // Update call in list if exists
      const index = calls.value.findIndex((c) => c.id === callId);
      if (index !== -1) {
        calls.value[index] = call;
      }
      
      return call;
    } catch (error) {
      console.error('Failed to fetch call:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function assignCall(callId: string) {
    try {
      const call = await dispatcherApi.assignCall(callId);
      
      // Update call in list
      const index = calls.value.findIndex((c) => c.id === callId);
      if (index !== -1) {
        calls.value[index] = call;
      }
      
      if (selectedCall.value?.id === callId) {
        selectedCall.value = call;
      }
      
      return call;
    } catch (error) {
      console.error('Failed to assign call:', error);
      throw error;
    }
  }

  async function updateCallStatus(callId: string, status: string, notes?: string) {
    try {
      const call = await dispatcherApi.updateCallStatus(callId, status, notes);
      
      // Update call in list
      const index = calls.value.findIndex((c) => c.id === callId);
      if (index !== -1) {
        calls.value[index] = call;
      }
      
      if (selectedCall.value?.id === callId) {
        selectedCall.value = call;
      }
      
      return call;
    } catch (error) {
      console.error('Failed to update call status:', error);
      throw error;
    }
  }

  async function fetchStats() {
    try {
      const data = await dispatcherApi.getStats();
      stats.value = data;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }

  function selectCall(call: EmergencyCall | null) {
    selectedCall.value = call;
  }

  return {
    calls,
    selectedCall,
    filters,
    total,
    isLoading,
    stats,
    activeCalls,
    criticalCalls,
    fetchCalls,
    fetchCall,
    assignCall,
    updateCallStatus,
    fetchStats,
    selectCall,
  };
});

