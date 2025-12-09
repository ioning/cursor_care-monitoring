import { apiClient } from './client';

const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

export type PlanItem = {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  activeSubscribers: number;
};

export type Transaction = {
  id: string;
  user: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  processedAt: string;
};

const mockPlans: PlanItem[] = [
  {
    id: 'plan-basic',
    name: 'Basic',
    price: 1490,
    currency: 'RUB',
    features: ['10 устройств', 'Базовые отчеты'],
    activeSubscribers: 320,
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise',
    price: 8990,
    currency: 'RUB',
    features: ['Неограниченные устройства', 'AI предикция', 'SLA 99.9%'],
    activeSubscribers: 42,
  },
];

const mockTransactions: Transaction[] = Array.from({ length: 12 }).map((_, idx) => ({
  id: `txn-${idx}`,
  user: `account-${idx}`,
  amount: 1490 + (idx % 4) * 800,
  currency: 'RUB',
  status: ['success', 'failed', 'pending'][idx % 3] as Transaction['status'],
  processedAt: new Date(Date.now() - idx * 3600 * 1000).toISOString(),
}));

export const fetchPlans = async (): Promise<PlanItem[]> => {
  if (useMocks) {
    return structuredClone(mockPlans);
  }
  const { data } = await apiClient.get<{ data: PlanItem[] }>('/billing/plans');
  return data.data;
};

export const fetchTransactions = async (): Promise<Transaction[]> => {
  if (useMocks) {
    return structuredClone(mockTransactions);
  }
  const { data } = await apiClient.get<{ data: Transaction[] }>('/billing/transactions');
  return data.data;
};

export const updatePlan = async (plan: PlanItem) => {
  if (useMocks) {
    return Promise.resolve({ success: true });
  }
  await apiClient.put(`/billing/plans/${plan.id}`, plan);
};

