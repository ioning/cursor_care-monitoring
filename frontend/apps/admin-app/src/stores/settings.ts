import { defineStore } from 'pinia';

import {
  fetchFeatureFlags,
  fetchGlobalSettings,
  updateFeatureFlag,
  updateGlobalSetting,
  type FeatureFlag,
  type GlobalSetting,
} from '@/api/settings.api';

type State = {
  flags: FeatureFlag[];
  globals: GlobalSetting[];
  loading: boolean;
};

export const useSettingsStore = defineStore('settings', {
  state: (): State => ({
    flags: [],
    globals: [],
    loading: false,
  }),
  actions: {
    async load() {
      this.loading = true;
      try {
        const [flags, globals] = await Promise.all([fetchFeatureFlags(), fetchGlobalSettings()]);
        this.flags = flags;
        this.globals = globals;
      } finally {
        this.loading = false;
      }
    },
    async toggleFlag(key: string, enabled: boolean) {
      const flag = this.flags.find((item) => item.key === key);
      if (!flag) return;
      const next = { ...flag, enabled };
      await updateFeatureFlag(next);
      flag.enabled = enabled;
    },
    async updateRollout(key: string, rollout: number) {
      const flag = this.flags.find((item) => item.key === key);
      if (!flag) return;
      const next = { ...flag, rollout };
      await updateFeatureFlag(next);
      flag.rollout = rollout;
    },
    async updateSetting(key: string, value: string) {
      await updateGlobalSetting(key, value);
      this.globals = this.globals.map((item) => (item.key === key ? { ...item, value } : item));
    },
  },
});

