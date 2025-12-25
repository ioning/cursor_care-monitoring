import { defineStore } from 'pinia';
import { ref } from 'vue';
import { wardsApi, type Ward, type CreateWardDto, type UpdateWardDto } from '../api/wards.api';

export const useWardsStore = defineStore('wards', () => {
  const wards = ref<Ward[]>([]);
  const currentWard = ref<Ward | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchWards = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await wardsApi.getWards();
      // API Gateway может возвращать { success: true, data: [...] } или напрямую массив
      if (response?.success && response?.data) {
        wards.value = response.data;
      } else if (Array.isArray(response?.data)) {
        wards.value = response.data;
      } else if (Array.isArray(response)) {
        wards.value = response;
      } else {
        console.warn('Unexpected response format:', response);
        wards.value = [];
      }
    } catch (err: any) {
      console.error('Error fetching wards:', err);
      error.value = err.response?.data?.message || 'Ошибка загрузки подопечных';
      wards.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  const fetchWard = async (wardId: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await wardsApi.getWard(wardId);
      // API Gateway может возвращать { success: true, data: {...} } или напрямую объект
      if (response?.success && response?.data) {
        currentWard.value = response.data;
        return response.data;
      } else if (response?.data) {
        currentWard.value = response.data;
        return response.data;
      } else {
        currentWard.value = response as any;
        return response as any;
      }
    } catch (err: any) {
      console.error('Error fetching ward:', err);
      error.value = err.response?.data?.message || 'Ошибка загрузки подопечного';
      currentWard.value = null;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const createWard = async (data: CreateWardDto) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await wardsApi.createWard(data);
      wards.value.push(response.data);
      return { ward: response.data, temporaryPassword: response.temporaryPassword };
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка создания подопечного';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateWard = async (wardId: string, data: UpdateWardDto) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await wardsApi.updateWard(wardId, data);
      const index = wards.value.findIndex((w) => w.id === wardId);
      if (index !== -1) {
        wards.value[index] = response.data;
      }
      if (currentWard.value?.id === wardId) {
        currentWard.value = response.data;
      }
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка обновления подопечного';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteWard = async (wardId: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      await wardsApi.deleteWard(wardId);
      wards.value = wards.value.filter((w) => w.id !== wardId);
      if (currentWard.value?.id === wardId) {
        currentWard.value = null;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка удаления подопечного';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    wards,
    currentWard,
    isLoading,
    error,
    fetchWards,
    fetchWard,
    createWard,
    updateWard,
    deleteWard,
  };
});

