import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { alertsApi, type Alert, type UpdateAlertStatusDto } from '../api/alerts.api';

export const useAlertsStore = defineStore('alerts', () => {
  const alerts = ref<Alert[]>([]);
  const currentAlert = ref<Alert | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref<{
    wardId?: string;
    status?: string;
    severity?: string;
    page?: number;
    limit?: number;
  }>({
    page: 1,
    limit: 20,
  });
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const activeAlerts = computed(() =>
    alerts.value.filter((a) => a.status === 'active'),
  );

  const criticalAlerts = computed(() =>
    alerts.value.filter((a) => a.severity === 'critical' && a.status === 'active'),
  );

  const fetchAlerts = async (newFilters?: typeof filters.value) => {
    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters };
    }
    isLoading.value = true;
    error.value = null;
    try {
      const response = await alertsApi.getAlerts(filters.value);
      alerts.value = response.data;
      pagination.value = response.meta;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка загрузки алертов';
    } finally {
      isLoading.value = false;
    }
  };

  const fetchAlert = async (alertId: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await alertsApi.getAlert(alertId);
      currentAlert.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка загрузки алерта';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateStatus = async (alertId: string, data: UpdateAlertStatusDto) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await alertsApi.updateStatus(alertId, data);
      const index = alerts.value.findIndex((a) => a.id === alertId);
      if (index !== -1) {
        alerts.value[index] = response.data;
      }
      if (currentAlert.value?.id === alertId) {
        currentAlert.value = response.data;
      }
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка обновления статуса';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const ingestRealtimeAlert = (payload: unknown) => {
    const normalized = normalizeAlertPayload(payload);
    if (!normalized) {
      return;
    }

    if (filters.value.wardId && normalized.wardId !== filters.value.wardId) {
      return;
    }
    if (filters.value.status && normalized.status !== filters.value.status) {
      return;
    }
    if (filters.value.severity && normalized.severity !== filters.value.severity) {
      return;
    }

    const existingIndex = alerts.value.findIndex((a) => a.id === normalized.id);
    if (existingIndex !== -1) {
      alerts.value[existingIndex] = normalized;
    } else {
      alerts.value = [normalized, ...alerts.value].slice(0, filters.value.limit ?? 20);
    }
    pagination.value = {
      ...pagination.value,
      total: (pagination.value.total ?? 0) + (existingIndex === -1 ? 1 : 0),
    };
  };

  const normalizeAlertPayload = (payload: unknown): Alert | null => {
    if (payload && typeof payload === 'object') {
      if ('data' in payload && typeof (payload as any).data === 'object') {
        return (payload as { data: Alert }).data;
      }
      if ('id' in payload) {
        return payload as Alert;
      }
    }
    return null;
  };

  return {
    alerts,
    currentAlert,
    activeAlerts,
    criticalAlerts,
    isLoading,
    error,
    filters,
    pagination,
    fetchAlerts,
    fetchAlert,
    updateStatus,
    ingestRealtimeAlert,
  };
});

