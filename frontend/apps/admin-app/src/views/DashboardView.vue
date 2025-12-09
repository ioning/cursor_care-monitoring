<template>
  <div class="dashboard">
    <SystemHealthOverview />

    <div class="grid">
      <ServiceMap @refresh="refresh" />
      <CriticalAlerts @ack-all="acknowledgeAlerts" />
    </div>

    <PerformanceTrends />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import CriticalAlerts from '@/components/dashboard/CriticalAlerts.vue';
import PerformanceTrends from '@/components/dashboard/PerformanceTrends.vue';
import ServiceMap from '@/components/dashboard/ServiceMap.vue';
import SystemHealthOverview from '@/components/dashboard/SystemHealthOverview.vue';
import { useRealtimeChannel } from '@/composables/useRealtimeChannel';
import { useShortcuts } from '@/composables/useShortcuts';
import { useSystemStore } from '@/stores/system';

const systemStore = useSystemStore();

const refresh = () => systemStore.bootstrap();
const acknowledgeAlerts = () => systemStore.acknowledgeAlerts();

useShortcuts([
  { combo: 'shift+h', handler: refresh },
  { combo: 'shift+e', handler: () => console.log('Export dashboard') },
]);

useRealtimeChannel('system.health', () => {
  refresh();
});

onMounted(() => {
  if (!systemStore.health) {
    void refresh();
  }
});
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 1.5rem;
}

@media (max-width: 1440px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>

