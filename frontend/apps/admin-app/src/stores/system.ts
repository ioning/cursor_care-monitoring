import { defineStore } from 'pinia';

import {
  fetchSystemHealth,
  fetchPerformanceTrends,
  fetchCriticalAlerts,
  type SystemHealthResponse,
  type PerformanceTrend,
  type AlertItem,
} from '@/api/system.api';

type State = {
  health: SystemHealthResponse | null;
  trends: PerformanceTrend[];
  alerts: AlertItem[];
  loading: boolean;
  lastUpdated: string | null;
};

export const useSystemStore = defineStore('system', {
  state: (): State => ({
    health: null,
    trends: [],
    alerts: [],
    loading: false,
    lastUpdated: null,
  }),
  actions: {
    async bootstrap() {
      this.loading = true;
      try {
        const [health, trends, alerts] = await Promise.all([
          fetchSystemHealth(),
          fetchPerformanceTrends(),
          fetchCriticalAlerts(),
        ]);
        this.health = health;
        this.trends = trends;
        this.alerts = alerts;
        this.lastUpdated = new Date().toISOString();
      } finally {
        this.loading = false;
      }
    },
    acknowledgeAlerts() {
      this.alerts = [];
    },
  },
});

