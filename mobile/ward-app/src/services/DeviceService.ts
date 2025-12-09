import { apiClient } from './ApiClient';

export interface Device {
  id: string;
  name: string;
  deviceType: string;
  status: string;
  lastSeenAt?: string;
}

export class DeviceService {
  static async getDevices(): Promise<Device[]> {
    const response = await apiClient.instance.get('/devices');
    return response.data;
  }

  static async connectDevice(deviceId: string): Promise<Device> {
    const response = await apiClient.instance.post(`/devices/${deviceId}/link`);
    return response.data;
  }
}

