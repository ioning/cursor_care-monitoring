<template>
  <div class="sparkline">
    <apexchart
      width="120"
      height="60"
      type="line"
      :options="options"
      :series="[{ name: 'trend', data }]"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  data: number[];
  color?: string;
}>();

const options = computed(() => ({
  chart: {
    sparkline: { enabled: true },
    animations: { enabled: true },
  },
  stroke: {
    width: 2.5,
    curve: 'smooth',
  },
  colors: [props.color ?? '#60a5fa'],
  tooltip: { enabled: false },
  fill: {
    opacity: 0.2,
    type: 'gradient',
    gradient: {
      shadeIntensity: 0.6,
      opacityFrom: 0.45,
      opacityTo: 0.05,
    },
  },
}));
</script>

<style scoped>
.sparkline {
  width: 120px;
  height: 60px;
}
</style>

