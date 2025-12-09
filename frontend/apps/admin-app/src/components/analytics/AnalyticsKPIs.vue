<template>
  <section class="grid">
    <MetricCard v-for="item in kpis" :key="item.label" :label="item.label" :value="formatValue(item)" :delta="item.delta">
      <template #extra>
        <TagPill variant="outline" v-if="item.target">Цель {{ item.target }}</TagPill>
      </template>
    </MetricCard>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';

import MetricCard from '@/components/common/MetricCard.vue';
import TagPill from '@/components/common/TagPill.vue';
import { useAnalyticsStore } from '@/stores/analytics';

const store = useAnalyticsStore();
const { kpis } = storeToRefs(store);

const formatValue = (item: (typeof kpis.value)[number]) => {
  if (item.label === 'MRR') {
    return `${new Intl.NumberFormat('ru-RU').format(item.value)} ₽`;
  }
  if (item.label === 'Churn') {
    return `${item.value}%`;
  }
  return `${item.value}`;
};
</script>

<style scoped>
.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
</style>

