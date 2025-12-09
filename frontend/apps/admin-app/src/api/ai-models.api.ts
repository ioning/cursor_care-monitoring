import { apiClient } from './client';

const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

export type ModelItem = {
  id: string;
  name: string;
  version: string;
  status: 'serving' | 'training' | 'degraded';
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
  };
  driftScore: number;
  lastDeployment: string;
};

const mockModels: ModelItem[] = [
  {
    id: 'mdl-1',
    name: 'Падения',
    version: '1.8.2',
    status: 'serving',
    metrics: { accuracy: 0.93, precision: 0.91, recall: 0.9, f1: 0.905 },
    driftScore: 0.22,
    lastDeployment: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mdl-2',
    name: 'Сердечные события',
    version: '2.4.0',
    status: 'degraded',
    metrics: { accuracy: 0.88, precision: 0.83, recall: 0.8, f1: 0.815 },
    driftScore: 0.63,
    lastDeployment: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const fetchModels = async (): Promise<ModelItem[]> => {
  if (useMocks) {
    return structuredClone(mockModels);
  }
  const { data } = await apiClient.get<{ data: ModelItem[] }>('/ai/models');
  return data.data;
};

export const scheduleTraining = async (payload: { modelId: string; cron: string }) => {
  if (useMocks) {
    return Promise.resolve({ success: true });
  }
  await apiClient.post('/ai/models/schedule', payload);
};

export const triggerABTest = async (payload: {
  modelA: string;
  modelB: string;
  trafficSplit: number;
}) => {
  if (useMocks) {
    return Promise.resolve({ success: true });
  }
  await apiClient.post('/ai/models/ab-test', payload);
};

