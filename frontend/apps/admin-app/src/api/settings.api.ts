import { apiClient } from './client';

const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

export type FeatureFlag = {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout: number;
  environments: string[];
};

export type GlobalSetting = {
  key: string;
  label: string;
  value: string;
  category: 'regional' | 'security' | 'notifications' | 'backup';
};

const mockFlags: FeatureFlag[] = [
  {
    key: 'ai_incident_routing',
    name: 'AI-роутинг инцидентов',
    description: 'Автоматическая маршрутизация инцидентов на команды',
    enabled: true,
    rollout: 75,
    environments: ['prod', 'staging'],
  },
  {
    key: 'realtime_dashboards',
    name: 'Realtime dashboards v2',
    description: 'Новая версия веб-сокет дашбордов',
    enabled: false,
    rollout: 0,
    environments: ['staging'],
  },
];

const mockSettings: GlobalSetting[] = [
  { key: 'timezone', label: 'Часовой пояс по умолчанию', value: 'Europe/Moscow', category: 'regional' },
  { key: 'currency', label: 'Основная валюта', value: 'RUB', category: 'regional' },
  { key: 'password_policy', label: 'Политика паролей', value: 'strict', category: 'security' },
  { key: 'backup_window', label: 'Окно бэкапа', value: '02:00-04:00 UTC', category: 'backup' },
];

export const fetchFeatureFlags = async (): Promise<FeatureFlag[]> => {
  if (useMocks) {
    return structuredClone(mockFlags);
  }
  const { data } = await apiClient.get<{ data: FeatureFlag[] }>('/settings/feature-flags');
  return data.data;
};

export const updateFeatureFlag = async (flag: FeatureFlag) => {
  if (useMocks) {
    return Promise.resolve({ success: true });
  }
  await apiClient.put(`/settings/feature-flags/${flag.key}`, flag);
};

export const fetchGlobalSettings = async (): Promise<GlobalSetting[]> => {
  if (useMocks) {
    return structuredClone(mockSettings);
  }
  const { data } = await apiClient.get<{ data: GlobalSetting[] }>('/settings');
  return data.data;
};

export const updateGlobalSetting = async (key: string, value: string) => {
  if (useMocks) {
    return Promise.resolve({ success: true });
  }
  await apiClient.patch(`/settings/${key}`, { value });
};

