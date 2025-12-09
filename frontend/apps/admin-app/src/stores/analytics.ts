import { defineStore } from 'pinia';

import {
  fetchFeatureUsage,
  fetchKpis,
  fetchRevenueSeries,
  type FeatureUsageItem,
  type KPIItem,
  type RevenuePoint,
} from '@/api/analytics.api';

type State = {
  kpis: KPIItem[];
  revenue: RevenuePoint[];
  usage: FeatureUsageItem[];
  loading: boolean;
  range: { from: string; to: string };
};

const formatMonth = (date: Date) => date.toISOString().slice(0, 7);

export const useAnalyticsStore = defineStore('analytics', {
  state: (): State => ({
    kpis: [],
    revenue: [],
    usage: [],
    loading: false,
    range: {
      from: formatMonth(new Date(new Date().setMonth(new Date().getMonth() - 1))),
      to: formatMonth(new Date()),
    },
  }),
  actions: {
    async load() {
      this.loading = true;
      try {
        const [kpis, revenue, usage] = await Promise.all([
          fetchKpis(),
          fetchRevenueSeries(),
          fetchFeatureUsage(),
        ]);
        this.kpis = kpis;
        this.revenue = revenue;
        this.usage = usage;
      } finally {
        this.loading = false;
      }
    },
    updateRange(range: { from: string; to: string }) {
      this.range = { from: range.from, to: range.to };
      void this.load();
    },
  },
});

