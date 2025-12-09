import { apiClient } from './client';

const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

export type ServiceHealth = {
  name: string;
  status: 'ok' | 'warning' | 'critical';
  latencyMs: number;
  errorRate: number;
};

export type SystemHealthResponse = {
  uptime: number;
  activeUsers: number;
  errorRate: number;
  load: number;
  services: ServiceHealth[];
};

const mockHealth: SystemHealthResponse = {
  uptime: 99.98,
  activeUsers: 12450,
  errorRate: 0.32,
  load: 0.68,
  services: [
    { name: 'API Gateway', status: 'warning', latencyMs: 210, errorRate: 0.45 },
    { name: 'Auth service', status: 'ok', latencyMs: 120, errorRate: 0.12 },
    { name: 'Billing service', status: 'ok', latencyMs: 180, errorRate: 0.08 },
    { name: 'Analytics service', status: 'critical', latencyMs: 450, errorRate: 1.2 },
  ],
};

export const fetchSystemHealth = async (): Promise<SystemHealthResponse> => {
  if (useMocks) {
    return Promise.resolve(structuredClone(mockHealth));
  }

  const { data } = await apiClient.get<{ data: SystemHealthResponse }>('/system/health');
  return data.data;
};

export type PerformanceTrend = {
  timestamp: string;
  latency: number;
  cpu: number;
  memory: number;
};

export const fetchPerformanceTrends = async (): Promise<PerformanceTrend[]> => {
  if (useMocks) {
    const now = Date.now();
    return Array.from({ length: 12 }).map((_, idx) => ({
      timestamp: new Date(now - idx * 60 * 60 * 1000).toISOString(),
      latency: 120 + Math.random() * 80,
      cpu: 40 + Math.random() * 35,
      memory: 55 + Math.random() * 25,
    }));
  }

  const { data } = await apiClient.get<{ data: PerformanceTrend[] }>('/system/performance');
  return data.data;
};

export type AlertItem = {
  id: string;
  severity: 'critical' | 'warning';
  title: string;
  service: string;
  detectedAt: string;
};

export const fetchCriticalAlerts = async (): Promise<AlertItem[]> => {
  if (useMocks) {
    return [
      {
        id: 'alert-1',
        severity: 'critical',
        title: 'Рост ошибок 500 в gateway',
        service: 'API Gateway',
        detectedAt: new Date().toISOString(),
      },
      {
        id: 'alert-2',
        severity: 'warning',
        title: 'Дрейф модели падений v1.8',
        service: 'AI Prediction',
        detectedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
    ];
  }

  const { data } = await apiClient.get<{ data: AlertItem[] }>('/system/alerts');
  return data.data;
};

