import { apiClient } from './ApiClient';
import { OfflineService } from './OfflineService';
import { store } from '../store';
import { RootState } from '../store';

export interface TelemetryData {
  deviceId?: string;
  wardId?: string;
  metricType: string;
  value: number;
  unit: string;
  qualityScore?: number;
  timestamp: string;
}

export interface TelemetryBatch {
  deviceId?: string;
  wardId?: string;
  metrics: Array<{
    metricType: string;
    value: number;
    unit: string;
    qualityScore?: number;
    timestamp: string;
  }>;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    source: string;
  };
}

export class TelemetryService {
  /**
   * Отправить телеметрию (с поддержкой офлайн режима)
   * @deprecated Используйте sendTelemetryBatch для пакетной отправки
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
   * Отправить пакет метрик (оптимизированная версия)
   */
  static async sendTelemetryBatch(batch: TelemetryBatch): Promise<void> {
    try {
      // Получаем текущую локацию из store
      const state: RootState = store.getState();
      const currentLocation = state.location?.currentLocation;

      // Формируем запрос в формате, ожидаемом API
      const requestData: any = {
        deviceId: batch.deviceId,
        metrics: batch.metrics.map((m) => ({
          type: m.metricType,
          value: m.value,
          unit: m.unit,
          qualityScore: m.qualityScore,
          timestamp: m.timestamp,
        })),
      };

      // Включаем локацию, если она доступна и не указана в batch
      if (!batch.location && currentLocation) {
        requestData.location = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
          source: 'mobile_app',
        };
      } else if (batch.location) {
        requestData.location = batch.location;
      }

      // Пытаемся отправить сразу
      await apiClient.instance.post('/telemetry', requestData);
    } catch (error: any) {
      // Если нет сети - добавляем в очередь
      if (!OfflineService.isNetworkAvailable() || error.code === 'NETWORK_ERROR') {
        await OfflineService.queueRequest({
          method: 'POST',
          url: '/telemetry',
          data: batch,
        });
        throw new Error('Telemetry batch queued for offline sync');
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

