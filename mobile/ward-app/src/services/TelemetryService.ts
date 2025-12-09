import { apiClient } from './ApiClient';

export interface TelemetryData {
  deviceId: string;
  metricType: string;
  value: number;
  unit: string;
  timestamp: string;
}

export class TelemetryService {
  static async sendTelemetry(data: TelemetryData): Promise<void> {
    await apiClient.instance.post('/telemetry', data);
  }

  static async getTelemetry(wardId: string, metricType?: string): Promise<TelemetryData[]> {
    const params = metricType ? { metricType } : {};
    const response = await apiClient.instance.get(`/telemetry/wards/${wardId}`, { params });
    return response.data;
  }
}

