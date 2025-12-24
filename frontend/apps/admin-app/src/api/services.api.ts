import { apiClient } from './client';

const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

export type ServiceStatus = 'healthy' | 'unhealthy' | 'unknown';

export type ServiceHealth = {
  name: string;
  status: ServiceStatus;
  latency?: number;
  timestamp?: string;
  checks?: {
    database?: 'up' | 'down';
    redis?: 'up' | 'down';
    rabbitmq?: 'up' | 'down';
  };
  error?: string;
};

export type ServicesHealthResponse = {
  services: ServiceHealth[];
};

const mockServices: ServiceHealth[] = [
  {
    name: 'API Gateway',
    status: 'healthy',
    latency: 12,
    timestamp: new Date().toISOString(),
  },
  {
    name: 'Auth Service',
    status: 'healthy',
    latency: 45,
    timestamp: new Date().toISOString(),
    checks: { database: 'up', redis: 'up' },
  },
  {
    name: 'User Service',
    status: 'healthy',
    latency: 38,
    timestamp: new Date().toISOString(),
    checks: { database: 'up', redis: 'up' },
  },
  {
    name: 'Device Service',
    status: 'warning',
    latency: 120,
    timestamp: new Date().toISOString(),
    checks: { database: 'up', rabbitmq: 'up' },
  },
  {
    name: 'Telemetry Service',
    status: 'healthy',
    latency: 56,
    timestamp: new Date().toISOString(),
    checks: { database: 'up', rabbitmq: 'up' },
  },
  {
    name: 'Alert Service',
    status: 'healthy',
    latency: 42,
    timestamp: new Date().toISOString(),
    checks: { database: 'up', rabbitmq: 'up' },
  },
  {
    name: 'Location Service',
    status: 'healthy',
    latency: 35,
    timestamp: new Date().toISOString(),
    checks: { database: 'up' },
  },
  {
    name: 'Billing Service',
    status: 'unhealthy',
    latency: 5000,
    timestamp: new Date().toISOString(),
    error: 'Service unavailable',
  },
  {
    name: 'Integration Service',
    status: 'healthy',
    latency: 78,
    timestamp: new Date().toISOString(),
    checks: { rabbitmq: 'up' },
  },
  {
    name: 'Dispatcher Service',
    status: 'healthy',
    latency: 41,
    timestamp: new Date().toISOString(),
    checks: { database: 'up' },
  },
  {
    name: 'Analytics Service',
    status: 'healthy',
    latency: 89,
    timestamp: new Date().toISOString(),
    checks: { database: 'up' },
  },
  {
    name: 'AI Prediction Service',
    status: 'healthy',
    latency: 156,
    timestamp: new Date().toISOString(),
    checks: { database: 'up', rabbitmq: 'up' },
  },
  {
    name: 'Organization Service',
    status: 'healthy',
    latency: 34,
    timestamp: new Date().toISOString(),
    checks: { database: 'up' },
  },
];

export const fetchServicesHealth = async (): Promise<ServicesHealthResponse> => {
  if (useMocks) {
    return Promise.resolve({
      services: structuredClone(mockServices),
    });
  }

  const { data } = await apiClient.get<{ data: ServicesHealthResponse }>('/services/health');
  return data.data;
};

export const restartService = async (serviceName: string): Promise<{ success: boolean; message: string }> => {
  if (useMocks) {
    return Promise.resolve({
      success: true,
      message: `Service ${serviceName} restart queued (mock)`,
    });
  }

  const { data } = await apiClient.post<{ data: { success: boolean; message: string } }>(
    `/services/${serviceName}/restart`,
  );
  return data.data;
};

export const restartAllServices = async (): Promise<{ success: boolean; message: string }> => {
  if (useMocks) {
    return Promise.resolve({
      success: true,
      message: 'All services restart queued (mock)',
    });
  }

  const { data } = await apiClient.post<{ data: { success: boolean; message: string } }>('/services/restart-all');
  return data.data;
};

