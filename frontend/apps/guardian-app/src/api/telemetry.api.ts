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
    return response.data;
  },

  getLatestTelemetry: async (
    wardId: string,
  ): Promise<{ success: boolean; data: TelemetryData }> => {
    const response = await apiClient.get(`/telemetry/wards/${wardId}/latest`);
    return response.data;
  },
};

