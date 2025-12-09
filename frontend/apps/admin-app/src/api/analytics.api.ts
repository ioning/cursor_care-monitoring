import { apiClient } from './client';

const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

export type KPIItem = {
  label: string;
  value: number;
  delta: number;
  target?: number;
};

export type RevenuePoint = {
  month: string;
  mrr: number;
  arr: number;
};

export type FeatureUsageItem = {
  feature: string;
  usage: number;
  trend: number[];
};

const mockKpi: KPIItem[] = [
  { label: 'MRR', value: 850000, delta: 6.4 },
  { label: 'Churn', value: 2.8, delta: -0.4, target: 3.5 },
  { label: 'Активность', value: 78, delta: 3.1, target: 80 },
];

const mockRevenue: RevenuePoint[] = Array.from({ length: 12 }).map((_, idx) => ({
  month: idx.toString(),
  mrr: 500000 + idx * 22000,
  arr: 5.5 * (500000 + idx * 22000),
}));

const mockUsage: FeatureUsageItem[] = [
  { feature: 'Телеметрия', usage: 78, trend: [60, 72, 75, 78] },
  { feature: 'AI Предикция', usage: 64, trend: [45, 55, 61, 64] },
  { feature: 'Алерты', usage: 88, trend: [70, 75, 81, 88] },
];

export const fetchKpis = async (): Promise<KPIItem[]> => {
  if (useMocks) {
    return structuredClone(mockKpi);
  }
  const { data } = await apiClient.get<{ data: KPIItem[] }>('/analytics/kpi');
  return data.data;
};

export const fetchRevenueSeries = async (): Promise<RevenuePoint[]> => {
  if (useMocks) {
    return structuredClone(mockRevenue);
  }
  const { data } = await apiClient.get<{ data: RevenuePoint[] }>('/analytics/revenue');
  return data.data;
};

export const fetchFeatureUsage = async (): Promise<FeatureUsageItem[]> => {
  if (useMocks) {
    return structuredClone(mockUsage);
  }
  const { data } = await apiClient.get<{ data: FeatureUsageItem[] }>('/analytics/usage');
  return data.data;
};

