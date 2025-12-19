import { apiClient } from './ApiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineService } from './OfflineService';

export interface TelemetryHistoryPoint {
  timestamp: string;
  value: number;
  metricType: string;
  unit: string;
}

export interface TelemetryHistory {
  metricType: string;
  unit: string;
  points: TelemetryHistoryPoint[];
  min: number;
  max: number;
  avg: number;
  latest: number;
}

export interface TelemetryChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

class TelemetryHistoryServiceClass {
  private readonly CACHE_PREFIX = '@telemetry_history:';
  private readonly CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

  /**
   * Получить историю телеметрии
   */
  async getHistory(
    wardId: string,
    metricType: string,
    from?: Date,
    to?: Date,
    limit: number = 100
  ): Promise<TelemetryHistory | null> {
    const cacheKey = `${this.CACHE_PREFIX}${wardId}:${metricType}`;

    // Пытаемся получить из кэша
    if (!from && !to) {
      const cached = await OfflineService.getCachedData<TelemetryHistory>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const params: any = { limit };
      if (from) params.from = from.toISOString();
      if (to) params.to = to.toISOString();

      const response = await apiClient.instance.get(`/telemetry/wards/${wardId}`, {
        params: { metricType, ...params },
      });

      const data = response.data.data || response.data || [];
      const points: TelemetryHistoryPoint[] = Array.isArray(data)
        ? data.map((item: any) => ({
            timestamp: item.timestamp || item.createdAt,
            value: item.value,
            metricType: item.metricType || metricType,
            unit: item.unit || '',
          }))
        : [];

      if (points.length === 0) {
        return null;
      }

      // Вычисляем статистику
      const values = points.map((p) => p.value);
      const history: TelemetryHistory = {
        metricType,
        unit: points[0].unit,
        points: points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        latest: values[values.length - 1],
      };

      // Кэшируем, если не указан период
      if (!from && !to) {
        await OfflineService.cacheData(cacheKey, history, this.CACHE_EXPIRY);
      }

      return history;
    } catch (error) {
      console.error('Failed to get telemetry history:', error);
      
      // Пытаемся вернуть из кэша при ошибке
      const cached = await OfflineService.getCachedData<TelemetryHistory>(cacheKey);
      return cached;
    }
  }

  /**
   * Получить данные для графика
   */
  async getChartData(
    wardId: string,
    metricType: string,
    period: '1h' | '6h' | '24h' | '7d' | '30d' = '24h',
    limit: number = 50
  ): Promise<TelemetryChartData | null> {
    const to = new Date();
    const from = new Date();

    switch (period) {
      case '1h':
        from.setHours(from.getHours() - 1);
        break;
      case '6h':
        from.setHours(from.getHours() - 6);
        break;
      case '24h':
        from.setHours(from.getHours() - 24);
        break;
      case '7d':
        from.setDate(from.getDate() - 7);
        break;
      case '30d':
        from.setDate(from.getDate() - 30);
        break;
    }

    const history = await this.getHistory(wardId, metricType, from, to, limit);
    if (!history || history.points.length === 0) {
      return null;
    }

    // Сортируем точки по времени (на случай, если они пришли не отсортированными)
    const sortedPoints = [...history.points].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Форматируем для графика
    const labels = sortedPoints.map((point) => {
      const date = new Date(point.timestamp);
      if (period === '1h' || period === '6h') {
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      } else if (period === '24h') {
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit' });
      } else {
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      }
    });

    const data = sortedPoints.map((point) => point.value);

    // Определяем цвет на основе типа метрики
    const colors: Record<string, string> = {
      heart_rate: '#E74C3C',
      temperature: '#F39C12',
      spo2: '#3498DB',
      steps: '#2ECC71',
      blood_pressure: '#9B59B6',
    };

    return {
      labels,
      datasets: [
        {
          label: this.getMetricLabel(metricType),
          data,
          color: colors[metricType] || '#2196F3',
        },
      ],
    };
  }

  /**
   * Получить человекочитаемое название метрики
   */
  private getMetricLabel(metricType: string): string {
    const labels: Record<string, string> = {
      heart_rate: 'Пульс',
      temperature: 'Температура',
      spo2: 'SpO2',
      steps: 'Шаги',
      blood_pressure: 'Давление',
      heart_rate_variability: 'HRV',
    };
    return labels[metricType] || metricType;
  }

  /**
   * Экспорт истории в CSV
   */
  async exportToCSV(
    wardId: string,
    metricType: string,
    from?: Date,
    to?: Date
  ): Promise<string> {
    const history = await this.getHistory(wardId, metricType, from, to, 10000);
    if (!history) {
      throw new Error('No data to export');
    }

    // Формируем CSV
    const headers = ['Timestamp', 'Value', 'Unit'];
    const rows = history.points.map((point) => [
      point.timestamp,
      point.value.toString(),
      point.unit,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    return csvContent;
  }

  /**
   * Получить множественные метрики для дашборда
   */
  async getMultipleMetrics(
    wardId: string,
    metricTypes: string[],
    period: '1h' | '6h' | '24h' = '24h'
  ): Promise<Record<string, TelemetryHistory | null>> {
    const results: Record<string, TelemetryHistory | null> = {};

    await Promise.all(
      metricTypes.map(async (metricType) => {
        try {
          const history = await this.getChartData(wardId, metricType, period);
          if (history) {
            // Конвертируем из chart data обратно в history
            const values = history.datasets[0].data;
            if (values.length > 0) {
              const points: TelemetryHistoryPoint[] = history.labels.map((label, index) => ({
                timestamp: new Date(Date.now() - (values.length - index) * (period === '1h' ? 3600000 / values.length : period === '6h' ? 21600000 / values.length : 86400000 / values.length)).toISOString(),
                value: values[index],
                metricType,
                unit: '',
              }));

              results[metricType] = {
                metricType,
                unit: '',
                points,
                min: Math.min(...values),
                max: Math.max(...values),
                avg: values.reduce((sum, val) => sum + val, 0) / values.length,
                latest: values[values.length - 1],
              };
            }
          }
        } catch (error) {
          console.error(`Failed to get metric ${metricType}:`, error);
          results[metricType] = null;
        }
      })
    );

    return results;
  }
}

export const TelemetryHistoryService = new TelemetryHistoryServiceClass();

