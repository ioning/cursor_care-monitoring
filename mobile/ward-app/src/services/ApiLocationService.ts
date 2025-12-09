import { apiClient } from './ApiClient';

export class LocationService {
  static async sendLocation(wardId: string, location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }): Promise<void> {
    await apiClient.instance.post(`/locations/wards/${wardId}`, {
      ...location,
      source: 'mobile_app',
    });
  }

  static async getLatestLocation(wardId: string) {
    const response = await apiClient.instance.get(`/locations/wards/${wardId}/latest`);
    return response.data;
  }
}

