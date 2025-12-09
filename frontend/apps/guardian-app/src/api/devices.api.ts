import { apiClient } from './client';

export interface Device {
  id: string;
  name: string;
  deviceType: string;
  firmwareVersion?: string;
  macAddress?: string;
  serialNumber?: string;
  status: string;
  wardId?: string;
  lastSeenAt?: string;
  createdAt: string;
}

export interface RegisterDeviceDto {
  name: string;
  deviceType: string;
  firmwareVersion?: string;
  macAddress?: string;
  serialNumber?: string;
}

export interface UpdateDeviceDto {
  name?: string;
  firmwareVersion?: string;
  status?: string;
}

export interface LinkDeviceDto {
  wardId: string;
}

export const devicesApi = {
  getDevices: async (wardId?: string): Promise<{ success: boolean; data: Device[] }> => {
    const response = await apiClient.get('/devices', { params: { wardId } });
    return response.data;
  },

  getDevice: async (deviceId: string): Promise<{ success: boolean; data: Device }> => {
    const response = await apiClient.get(`/devices/${deviceId}`);
    return response.data;
  },

  registerDevice: async (
    data: RegisterDeviceDto,
  ): Promise<{ success: boolean; data: Device & { apiKey: string } }> => {
    const response = await apiClient.post('/devices/register', data);
    return response.data;
  },

  updateDevice: async (
    deviceId: string,
    data: UpdateDeviceDto,
  ): Promise<{ success: boolean; data: Device }> => {
    const response = await apiClient.put(`/devices/${deviceId}`, data);
    return response.data;
  },

  deleteDevice: async (deviceId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/devices/${deviceId}`);
    return response.data;
  },

  linkDevice: async (deviceId: string, data: LinkDeviceDto): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/devices/${deviceId}/link`, data);
    return response.data;
  },

  unlinkDevice: async (deviceId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/devices/${deviceId}/unlink`);
    return response.data;
  },
};

