import { defineStore } from 'pinia';

import { fetchModels, scheduleTraining, triggerABTest, type ModelItem } from '@/api/ai-models.api';

type State = {
  models: ModelItem[];
  loading: boolean;
};

export const useAiModelsStore = defineStore('ai-models', {
  state: (): State => ({
    models: [],
    loading: false,
  }),
  actions: {
    async load() {
      this.loading = true;
      try {
        this.models = await fetchModels();
      } finally {
        this.loading = false;
      }
    },
    async planTraining(modelId: string, cron: string) {
      await scheduleTraining({ modelId, cron });
    },
    async startABTest(modelA: string, modelB: string, trafficSplit: number) {
      await triggerABTest({ modelA, modelB, trafficSplit });
    },
  },
});

