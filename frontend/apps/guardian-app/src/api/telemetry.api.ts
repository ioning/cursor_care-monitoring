import { apiClient } from './client';

export interface TelemetryMetric {
  type: string;
  value: number;
  unit?: string;
  qualityScore?: number;
  timestamp: string;
}

export interface TelemetryData {
  wardId: string;
  timestamp: string;
  metrics: Record<string, {
    value: number;
    unit?: string;
    qualityScore?: number;
    timestamp: string;
  }>;
}

export interface TelemetryResponse {
  success: boolean;
  data: TelemetryData[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const telemetryApi = {
  getWardTelemetry: async (
    wardId: string,
    params?: {
      from?: string;
      to?: string;
      metricType?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<TelemetryResponse> => {
    const response = await apiClient.get(`/telemetry/wards/${wardId}`, { params });
    // API Gateway может возвращать { success: true, data: [...] } или напрямую массив
    const data = response.data;
    if (data?.success && data?.data) {
      return {
        success: true,
        data: data.data,
        meta: data.meta,
      };
    }
    // Если структура уже правильная
    return data;
  },

  getLatestTelemetry: async (
    wardId: string,
  ): Promise<{ success: boolean; data: TelemetryData }> => {
    const response = await apiClient.get(`/telemetry/wards/${wardId}/latest`);
    // API Gateway может возвращать { success: true, data: {...} } или напрямую объект
    const data = response.data;
    if (data?.success && data?.data) {
      return {
        success: true,
        data: data.data,
      };
    }
    // Если структура уже правильная
    return {
      success: true,
      data: data,
    };
  },
};

