<template>
  <section class="grid">
    <MetricCard label="Аптайм" :value="health?.uptime ? `${health.uptime}%` : '—'" :delta="1.2">
      <Sparkline v-if="uptimeTrend.length" :data="uptimeTrend" color="#34d399" />
    </MetricCard>
    <MetricCard label="Активные пользователи" :value="health?.activeUsers ?? '—'" :delta="4.1">
      <Sparkline v-if="activeUsersTrend.length" :data="activeUsersTrend" color="#a78bfa" />
    </MetricCard>
    <MetricCard label="Ошибки" :value="`${health?.errorRate ?? '—'}%`" :delta="-0.5">
      <Sparkline v-if="errorTrend.length" :data="errorTrend" color="#f87171" />
    </MetricCard>
    <MetricCard label="Нагрузка" :value="`${(health?.load ?? 0) * 100}%`" :delta="0.8">
      <Sparkline v-if="loadTrend.length" :data="loadTrend" color="#fbbf24" />
    </MetricCard>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import MetricCard from '@/components/common/MetricCard.vue';
import Sparkline from '@/components/common/Sparkline.vue';
import { useSystemStore } from '@/stores/system';

const systemStore = useSystemStore();
const { health, trends } = storeToRefs(systemStore);

const uptimeTrend = computed(() => trends.value.map((t) => 100 - t.latency / 10));
const activeUsersTrend = computed(() => trends.value.map((t) => 100 + t.cpu));
const errorTrend = computed(() => trends.value.map((t) => t.latency / 10));
const loadTrend = computed(() => trends.value.map((t) => t.cpu));
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
</style>

