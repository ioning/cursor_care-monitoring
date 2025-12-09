import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  devicesApi,
  type Device,
  type RegisterDeviceDto,
  type UpdateDeviceDto,
  type LinkDeviceDto,
} from '../api/devices.api';

export const useDevicesStore = defineStore('devices', () => {
  const devices = ref<Device[]>([]);
  const currentDevice = ref<Device | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchDevices = async (wardId?: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await devicesApi.getDevices(wardId);
      devices.value = response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка загрузки устройств';
    } finally {
      isLoading.value = false;
    }
  };

  const fetchDevice = async (deviceId: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await devicesApi.getDevice(deviceId);
      currentDevice.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка загрузки устройства';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const registerDevice = async (data: RegisterDeviceDto) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await devicesApi.registerDevice(data);
      devices.value.push(response.data);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка регистрации устройства';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateDevice = async (deviceId: string, data: UpdateDeviceDto) => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await devicesApi.updateDevice(deviceId, data);
      const index = devices.value.findIndex((d) => d.id === deviceId);
      if (index !== -1) {
        devices.value[index] = response.data;
      }
      if (currentDevice.value?.id === deviceId) {
        currentDevice.value = response.data;
      }
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка обновления устройства';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteDevice = async (deviceId: string) => {
    isLoading.value = true;
    error.value = null;
    try {
      await devicesApi.deleteDevice(deviceId);
      devices.value = devices.value.filter((d) => d.id !== deviceId);
      if (currentDevice.value?.id === deviceId) {
        currentDevice.value = null;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка удаления устройства';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const linkDevice = async (deviceId: string, data: LinkDeviceDto) => {
    isLoading.value = true;
    error.value = null;
    try {
      await devicesApi.linkDevice(deviceId, data);
      await fetchDevices();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка привязки устройства';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    devices,
    currentDevice,
    isLoading,
    error,
    fetchDevices,
    fetchDevice,
    registerDevice,
    updateDevice,
    deleteDevice,
    linkDevice,
  };
});

