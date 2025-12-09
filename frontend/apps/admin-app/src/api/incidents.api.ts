import { apiClient } from './client';

const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

export type IncidentItem = {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: 'investigating' | 'mitigated' | 'resolved';
  openedAt: string;
  affectedServices: string[];
  sloBreachRisk: number;
};

export type TimelineEvent = {
  id: string;
  at: string;
  type: 'alert' | 'action' | 'note';
  description: string;
  author: string;
};

const mockIncidents: IncidentItem[] = [
  {
    id: 'INC-2042',
    title: 'Рост 5xx API Gateway',
    severity: 'critical',
    status: 'investigating',
    openedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    affectedServices: ['API Gateway', 'Guardian app'],
    sloBreachRisk: 0.78,
  },
  {
    id: 'INC-2041',
    title: 'Задержки загрузки аналитики',
    severity: 'medium',
    status: 'mitigated',
    openedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    affectedServices: ['Analytics service'],
    sloBreachRisk: 0.34,
  },
];

const mockTimeline: TimelineEvent[] = [
  {
    id: 'evt-1',
    at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    type: 'alert',
    description: 'AI обнаружил рост ошибок 5xx на 140%',
    author: 'AI Engine',
  },
  {
    id: 'evt-2',
    at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    type: 'action',
    description: 'Переключили 20% трафика на канареечную версию',
    author: 'd.ops',
  },
  {
    id: 'evt-3',
    at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    type: 'note',
    description: 'Подозрение на деградацию базы данных',
    author: 'sre.lead',
  },
];

export const fetchIncidents = async (): Promise<IncidentItem[]> => {
  if (useMocks) {
    return structuredClone(mockIncidents);
  }
  const { data } = await apiClient.get<{ data: IncidentItem[] }>('/incidents');
  return data.data;
};

export const fetchIncidentTimeline = async (incidentId: string): Promise<TimelineEvent[]> => {
  if (useMocks) {
    return structuredClone(mockTimeline);
  }
  const { data } = await apiClient.get<{ data: TimelineEvent[] }>(
    `/incidents/${incidentId}/timeline`,
  );
  return data.data;
};

export const triggerIncidentAction = async (
  incidentId: string,
  payload: { action: string; metadata?: Record<string, unknown> },
) => {
  if (useMocks) {
    return Promise.resolve({ success: true });
  }
  await apiClient.post(`/incidents/${incidentId}/actions`, payload);
};

