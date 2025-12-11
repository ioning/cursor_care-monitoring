import { apiClient } from './ApiClient';
import { LocationService } from './ApiLocationService';

export interface WardStatus {
  wardId: string;
  fullName: string;
  status: 'stable' | 'attention' | 'alert';
  lastSeen: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  lastLocationUpdate?: string;
}

export class WardStatusService {
  /**
   * Получить статус всех подопечных для опекуна
   */
  static async getWardsStatus(): Promise<WardStatus[]> {
    try {
      // Получаем список подопечных
      const wardsResponse = await apiClient.instance.get('/users/wards');
      const wards = wardsResponse.data.data || [];

      // Для каждого подопечного получаем последнее местоположение
      const wardsStatus: WardStatus[] = await Promise.all(
        wards.map(async (ward: any) => {
          try {
            // Получаем последнее местоположение
            const locationResponse = await LocationService.getLatestLocation(ward.id);
            const location = locationResponse.data || locationResponse;

            // Определяем статус на основе времени последнего обновления
            const lastUpdate = location?.timestamp || location?.createdAt;
            const lastSeen = lastUpdate
              ? this.formatLastSeen(new Date(lastUpdate))
              : 'нет данных';

            // Определяем статус (можно улучшить логику на основе алертов)
            let status: 'stable' | 'attention' | 'alert' = 'stable';
            if (!lastUpdate) {
              status = 'attention';
            } else {
              const minutesSinceUpdate = (Date.now() - new Date(lastUpdate).getTime()) / 60000;
              if (minutesSinceUpdate > 60) {
                status = 'alert';
              } else if (minutesSinceUpdate > 30) {
                status = 'attention';
              }
            }

            return {
              wardId: ward.id,
              fullName: ward.fullName,
              status,
              lastSeen,
              location: location
                ? {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    address: location.address,
                  }
                : undefined,
              lastLocationUpdate: lastUpdate,
            };
          } catch (error) {
            console.error(`Failed to get location for ward ${ward.id}:`, error);
            return {
              wardId: ward.id,
              fullName: ward.fullName,
              status: 'attention' as const,
              lastSeen: 'нет данных',
            };
          }
        }),
      );

      return wardsStatus;
    } catch (error) {
      console.error('Failed to get wards status:', error);
      throw error;
    }
  }

  /**
   * Форматирует время последнего обновления в читаемый формат
   */
  private static formatLastSeen(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'только что';
    } else if (diffMins < 60) {
      return `${diffMins} мин назад`;
    } else if (diffHours < 24) {
      return `${diffHours} ч назад`;
    } else if (diffDays === 1) {
      return 'вчера';
    } else if (diffDays < 7) {
      return `${diffDays} дн назад`;
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
  }
}

