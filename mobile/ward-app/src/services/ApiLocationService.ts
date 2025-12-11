import { apiClient } from './ApiClient';
import { OfflineService } from './OfflineService';

export class LocationService {
  static async sendLocation(wardId: string, location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }): Promise<void> {
    try {
      await apiClient.instance.post(`/locations/wards/${wardId}`, {
        ...location,
        source: 'mobile_app',
      });
    } catch (error: any) {
      // Если нет сети - добавляем в очередь
      if (!OfflineService.isNetworkAvailable() || error.code === 'NETWORK_ERROR') {
        await OfflineService.queueRequest({
          method: 'POST',
          url: `/locations/wards/${wardId}`,
          data: {
            ...location,
            source: 'mobile_app',
          },
        });
        return;
      }
      throw error;
    }
  }

  static async getLatestLocation(wardId: string) {
    const response = await apiClient.instance.get(`/locations/wards/${wardId}/latest`);
    return response.data;
  }
}

