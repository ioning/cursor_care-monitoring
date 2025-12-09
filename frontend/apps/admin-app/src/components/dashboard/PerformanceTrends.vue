<template>
  <section class="glass-panel trends">
    <header>
      <div>
        <h3>Производительность</h3>
        <p>API latency, CPU, RAM</p>
      </div>
      <div class="controls">
        <select v-model="metric">
          <option value="latency">Latency</option>
          <option value="cpu">CPU</option>
          <option value="memory">RAM</option>
        </select>
      </div>
    </header>

    <apexchart type="area" height="240" :options="chartOptions" :series="series" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useSystemStore } from '@/stores/system';

const systemStore = useSystemStore();
const { trends } = storeToRefs(systemStore);

const metric = ref<'latency' | 'cpu' | 'memory'>('latency');

const chartOptions = computed(() => ({
  chart: { toolbar: { show: false } },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  xaxis: { type: 'datetime' },
  colors: ['#6ee7b7'],
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 },
  },
}));

const series = computed(() => [
  {
    name: metric.value,
    data: trends.value.map((point) => ({
      x: point.timestamp,
      y: point[metric.value],
    })),
  },
]);
</script>

<style scoped>
.trends {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

select {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  padding: 0.5rem 0.75rem;
}
</style>

