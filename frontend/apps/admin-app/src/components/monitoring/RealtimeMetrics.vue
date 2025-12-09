<template>
  <section class="glass-panel realtime">
    <header>
      <h3>Live метрики</h3>
      <span>обновлено {{ lastUpdated }}</span>
    </header>
    <div class="stats">
      <div v-for="metric in metrics" :key="metric.label">
        <p>{{ metric.label }}</p>
        <strong>{{ metric.value }}</strong>
        <small :class="{ up: metric.delta >= 0, down: metric.delta < 0 }">
          {{ metric.delta >= 0 ? '+' : '' }}{{ metric.delta }}%
        </small>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { useRealtimeChannel } from '@/composables/useRealtimeChannel';
import { useSystemStore } from '@/stores/system';

const store = useSystemStore();
const lastUpdated = computed(() =>
  store.lastUpdated ? new Intl.DateTimeFormat('ru-RU', { timeStyle: 'medium' }).format(new Date(store.lastUpdated)) : '—',
);

const metrics = ref([
  { label: 'RPS', value: 1250, delta: 4.2 },
  { label: 'Ошибки/с', value: 12, delta: -1.1 },
  { label: 'Очередь задач', value: 220, delta: 2.4 },
]);

useRealtimeChannel('monitoring.live', (payload) => {
  if (typeof payload === 'object' && payload && 'metrics' in (payload as Record<string, unknown>)) {
    metrics.value = (payload as { metrics: typeof metrics.value }).metrics;
  }
});
</script>

<style scoped>
.realtime {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

p {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
}

strong {
  font-size: 1.6rem;
}

small.up {
  color: #4ade80;
}

small.down {
  color: #f87171;
}
</style>

