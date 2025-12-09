<template>
  <div class="feature-illustration">
    <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient :id="`gradient-${type}`" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :style="`stop-color:${colors[0]};stop-opacity:0.2`" />
          <stop offset="100%" :style="`stop-color:${colors[1]};stop-opacity:0.2`" />
        </linearGradient>
      </defs>
      
      <rect width="300" height="200" rx="12" :fill="`url(#gradient-${type})`" />
      
      <component :is="illustrationComponent" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';

interface Props {
  type: 'telemetry' | 'ai' | 'emergency' | 'location' | 'mobile' | 'analytics';
}

const props = defineProps<Props>();

const colors = computed(() => {
  const colorMap: Record<string, [string, string]> = {
    telemetry: ['#3b82f6', '#06b6d4'],
    ai: ['#7c3aed', '#a855f7'],
    emergency: ['#ef4444', '#f59e0b'],
    location: ['#10b981', '#3b82f6'],
    mobile: ['#8b5cf6', '#ec4899'],
    analytics: ['#06b6d4', '#3b82f6'],
  };
  return colorMap[props.type] || ['#3b82f6', '#7c3aed'];
});

const illustrationComponent = computed(() => {
  const components: Record<string, any> = {
    telemetry: () => h('g', [
      // Chart
      h('rect', { x: 50, y: 80, width: 200, height: 80, rx: 4, fill: '#ffffff', opacity: 0.9 }),
      h('path', {
        d: 'M 60 140 L 80 120 L 100 130 L 120 100 L 140 110 L 160 90 L 180 100 L 200 80 L 220 85',
        stroke: colors.value[0],
        'stroke-width': 3,
        fill: 'none',
      }),
      h('circle', { cx: 60, cy: 140, r: 4, fill: colors.value[0] }),
      h('circle', { cx: 220, cy: 85, r: 4, fill: colors.value[0] }),
      h('text', { x: 150, y: 50, 'font-size': 16, fill: colors.value[0], 'text-anchor': 'middle', 'font-weight': 'bold' }, 'Мониторинг'),
    ]),
    ai: () => h('g', [
      // Brain with connections
      h('path', {
        d: 'M 100 100 Q 120 80 140 100 Q 160 120 140 140 Q 120 160 100 140 Q 80 120 100 100',
        fill: colors.value[0],
        opacity: 0.6,
      }),
      h('circle', { cx: 110, cy: 110, r: 3, fill: '#ffffff' }),
      h('circle', { cx: 130, cy: 110, r: 3, fill: '#ffffff' }),
      h('path', {
        d: 'M 100 100 L 200 80 M 140 100 L 200 100 M 100 140 L 200 120',
        stroke: colors.value[1],
        'stroke-width': 2,
        opacity: 0.5,
      }),
      h('text', { x: 150, y: 50, 'font-size': 16, fill: colors.value[0], 'text-anchor': 'middle', 'font-weight': 'bold' }, 'AI Аналитика'),
    ]),
    emergency: () => h('g', [
      // Alert triangle
      h('path', {
        d: 'M 150 60 L 100 140 L 200 140 Z',
        fill: colors.value[0],
        opacity: 0.8,
      }),
      h('text', { x: 150, y: 120, 'font-size': 24, fill: '#ffffff', 'text-anchor': 'middle', 'font-weight': 'bold' }, '!'),
      h('circle', { cx: 150, cy: 160, r: 20, fill: colors.value[1], opacity: 0.3 }),
      h('text', { x: 150, y: 50, 'font-size': 16, fill: colors.value[0], 'text-anchor': 'middle', 'font-weight': 'bold' }, 'Экстренные вызовы'),
    ]),
    location: () => h('g', [
      // Map pin
      h('path', {
        d: 'M 150 60 L 130 100 L 150 120 L 170 100 Z',
        fill: colors.value[0],
      }),
      h('circle', { cx: 150, cy: 80, r: 8, fill: '#ffffff' }),
      h('circle', { cx: 150, cy: 140, r: 40, fill: colors.value[1], opacity: 0.2 }),
      h('circle', { cx: 150, cy: 140, r: 25, fill: colors.value[1], opacity: 0.3 }),
      h('text', { x: 150, y: 50, 'font-size': 16, fill: colors.value[0], 'text-anchor': 'middle', 'font-weight': 'bold' }, 'Геолокация'),
    ]),
    mobile: () => h('g', [
      // Phone
      h('rect', { x: 100, y: 60, width: 100, height: 140, rx: 12, fill: '#1f2937', stroke: colors.value[0], 'stroke-width': 3 }),
      h('rect', { x: 110, y: 80, width: 80, height: 100, rx: 4, fill: '#ffffff' }),
      h('circle', { cx: 150, cy: 190, r: 8, fill: colors.value[0] }),
      h('text', { x: 150, y: 50, 'font-size': 16, fill: colors.value[0], 'text-anchor': 'middle', 'font-weight': 'bold' }, 'Мобильные приложения'),
    ]),
    analytics: () => h('g', [
      // Bar chart
      h('rect', { x: 80, y: 120, width: 30, height: 50, fill: colors.value[0] }),
      h('rect', { x: 120, y: 100, width: 30, height: 70, fill: colors.value[1] }),
      h('rect', { x: 160, y: 90, width: 30, height: 80, fill: colors.value[0] }),
      h('rect', { x: 200, y: 110, width: 30, height: 60, fill: colors.value[1] }),
      h('text', { x: 150, y: 50, 'font-size': 16, fill: colors.value[0], 'text-anchor': 'middle', 'font-weight': 'bold' }, 'Аналитика'),
    ]),
  };
  return components[props.type] || components.telemetry;
});
</script>

<style scoped>
.feature-illustration {
  width: 100%;
  height: 200px;
  margin-bottom: 1rem;
}

.feature-illustration svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>






