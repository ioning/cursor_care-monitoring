import { apiClient } from './ApiClient';
import { OfflineService } from './OfflineService';

export interface TelemetryData {
  deviceId?: string;
  wardId?: string;
  metricType: string;
  value: number;
  unit: string;
  timestamp: string;
}

export class TelemetryService {
  /**
   * Отправить телеметрию (с поддержкой офлайн режима)
   */
  static async sendTelemetry(data: TelemetryData): Promise<void> {
    try {
      // Пытаемся отправить сразу
      await apiClient.instance.post('/telemetry', data);
    } catch (error: any) {
      // Если нет сети - добавляем в очередь
      if (!OfflineService.isNetworkAvailable() || error.code === 'NETWORK_ERROR') {
        await OfflineService.queueRequest({
          method: 'POST',
          url: '/telemetry',
          data,
        });
        throw new Error('Telemetry queued for offline sync');
      }
      throw error;
    }
  }

  /**
   * Получить телеметрию (с кэшированием)
   */
  static async getTelemetry(wardId: string, metricType?: string): Promise<TelemetryData[]> {
    const cacheKey = `telemetry:${wardId}:${metricType || 'all'}`;

    // Пытаемся получить из кэша
    const cached = await OfflineService.getCachedData<TelemetryData[]>(cacheKey);
    if (cached && OfflineService.isNetworkAvailable() === false) {
      return cached;
    }

    try {
      const params = metricType ? { metricType } : {};
      const response = await apiClient.instance.get(`/telemetry/wards/${wardId}`, { params });
      const data = response.data.data || response.data || [];

      // Кэшируем результат
      await OfflineService.cacheData(cacheKey, data, 5 * 60 * 1000); // 5 минут

      return data;
    } catch (error: any) {
      // Если нет сети - возвращаем из кэша
      if (!OfflineService.isNetworkAvailable() || error.code === 'NETWORK_ERROR') {
        if (cached) return cached;
        throw new Error('No network connection and no cached data available');
      }
      throw error;
    }
  }

  /**
   * Получить последние показатели для дашборда
   */
  static async getLatestMetrics(wardId: string): Promise<Record<string, TelemetryData>> {
    try {
      const metrics: TelemetryData[] = await this.getTelemetry(wardId);
      
      // Группируем по типу метрики и берем последнее значение
      const latest: Record<string, TelemetryData> = {};
      
      metrics.forEach((metric) => {
        const existing = latest[metric.metricType];
        if (!existing || new Date(metric.timestamp) > new Date(existing.timestamp)) {
          latest[metric.metricType] = metric;
        }
      });

      return latest;
    } catch (error) {
      console.error('Failed to get latest metrics:', error);
      return {};
    }
  }
}

