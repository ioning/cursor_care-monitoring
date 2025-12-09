import { defineStore } from 'pinia';

import {
  fetchIncidentTimeline,
  fetchIncidents,
  type IncidentItem,
  type TimelineEvent,
  triggerIncidentAction,
} from '@/api/incidents.api';

type State = {
  list: IncidentItem[];
  timeline: TimelineEvent[];
  activeIncidentId: string | null;
  loading: boolean;
  timelineLoading: boolean;
};

export const useIncidentsStore = defineStore('incidents', {
  state: (): State => ({
    list: [],
    timeline: [],
    activeIncidentId: null,
    loading: false,
    timelineLoading: false,
  }),
  actions: {
    async loadIncidents() {
      this.loading = true;
      try {
        this.list = await fetchIncidents();
        if (!this.activeIncidentId && this.list.length) {
          this.activeIncidentId = this.list[0].id;
        }
      } finally {
        this.loading = false;
      }
    },
    async loadTimeline(incidentId: string) {
      this.activeIncidentId = incidentId;
      this.timelineLoading = true;
      try {
        this.timeline = await fetchIncidentTimeline(incidentId);
      } finally {
        this.timelineLoading = false;
      }
    },
    async runAction(action: string, metadata?: Record<string, unknown>) {
      if (!this.activeIncidentId) return;
      await triggerIncidentAction(this.activeIncidentId, { action, metadata });
      await this.loadTimeline(this.activeIncidentId);
    },
  },
});

