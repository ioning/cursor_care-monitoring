<template>
  <section class="glass-panel revenue">
    <header>
      <div>
        <h3>Доходы</h3>
        <p>MRR / ARR за период</p>
      </div>
      <div class="range">
        <input type="month" v-model="range.from" @change="updateRange" />
        <input type="month" v-model="range.to" @change="updateRange" />
      </div>
    </header>
    <apexchart type="bar" height="260" :options="options" :series="series" />
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { useAnalyticsStore } from '@/stores/analytics';

const store = useAnalyticsStore();
const { revenue, range } = storeToRefs(store);

const options = computed(() => ({
  chart: { stacked: true, toolbar: { show: false } },
  xaxis: {
    categories: revenue.value.map((point) => point.month),
  },
  legend: { position: 'top' },
  fill: { opacity: 0.8 },
  colors: ['#60a5fa', '#34d399'],
}));

const series = computed(() => [
  { name: 'MRR', data: revenue.value.map((point) => point.mrr) },
  { name: 'ARR', data: revenue.value.map((point) => point.arr) },
]);

const updateRange = () => {
  store.updateRange(range.value);
};
</script>

<style scoped>
.revenue {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.range {
  display: flex;
  gap: 0.5rem;
}

input {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  padding: 0.4rem 0.6rem;
}
</style>

