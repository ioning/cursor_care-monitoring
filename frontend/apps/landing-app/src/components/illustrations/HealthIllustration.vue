<template>
  <div class="health-illustration">
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient :id="`healthGradient-${type}`" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :style="`stop-color:${color};stop-opacity:0.1`" />
          <stop offset="100%" :style="`stop-color:${color};stop-opacity:0.3`" />
        </linearGradient>
      </defs>
      
      <rect width="400" height="300" rx="16" :fill="`url(#healthGradient-${type})`" />
      
      <component :is="illustrationComponent" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';

interface Props {
  type: 'fall' | 'heart' | 'breathing' | 'temperature' | 'sleep' | 'emergency';
}

const props = defineProps<Props>();

const color = computed(() => {
  const colorMap: Record<string, string> = {
    fall: '#f59e0b',
    heart: '#ef4444',
    breathing: '#06b6d4',
    temperature: '#f97316',
    sleep: '#8b5cf6',
    emergency: '#dc2626',
  };
  return colorMap[props.type] || '#3b82f6';
});

const illustrationComponent = computed(() => {
  const components: Record<string, any> = {
    fall: () => h('g', [
      // Person falling
      h('circle', { cx: 200, cy: 120, r: 25, fill: '#fbbf24' }), // Head
      h('ellipse', { cx: 200, cy: 180, rx: 20, ry: 40, fill: '#3b82f6', transform: 'rotate(-20 200 180)' }), // Body
      h('line', { x1: 180, y1: 200, x2: 160, y2: 240, stroke: '#1f2937', 'stroke-width': 3 }), // Legs
      h('line', { x1: 220, y1: 200, x2: 240, y2: 240, stroke: '#1f2937', 'stroke-width': 3 }),
      h('line', { x1: 190, y1: 160, x2: 170, y2: 200, stroke: '#1f2937', 'stroke-width': 3 }), // Arms
      h('line', { x1: 210, y1: 160, x2: 230, y2: 200, stroke: '#1f2937', 'stroke-width': 3 }),
      // Warning symbol
      h('path', { d: 'M 200 60 L 160 140 L 240 140 Z', fill: color.value, opacity: 0.8 }),
      h('text', { x: 200, y: 110, 'font-size': 20, fill: '#ffffff', 'text-anchor': 'middle', 'font-weight': 'bold' }, '!'),
    ]),
    heart: () => h('g', [
      // Heart
      h('path', {
        d: 'M 200 100 C 200 80, 180 80, 180 100 C 180 80, 160 80, 160 100 C 160 120, 200 160, 200 160 C 200 160, 240 120, 240 100 C 240 80, 220 80, 220 100 C 220 80, 200 80, 200 100',
        fill: color.value,
        opacity: 0.8,
      }),
      // ECG line
      h('path', {
        d: 'M 100 200 L 120 200 L 130 180 L 140 200 L 160 200 L 170 160 L 180 200 L 200 200 L 210 140 L 220 200 L 240 200 L 250 180 L 260 200 L 300 200',
        stroke: color.value,
        'stroke-width': 3,
        fill: 'none',
      }),
      h('text', { x: 200, y: 50, 'font-size': 18, fill: color.value, 'text-anchor': 'middle', 'font-weight': 'bold' }, 'Сердце'),
    ]),
    breathing: () => h('g', [
      // Lungs
      h('path', {
        d: 'M 150 100 Q 130 120 130 160 Q 130 200 150 220 Q 170 200 170 160 Q 170 120 150 100',
        fill: color.value,
        opacity: 0.6,
      }),
      h('path', {
        d: 'M 250 100 Q 270 120 270 160 Q 270 200 250 220 Q 230 200 230 160 Q 230 120 250 100',
        fill: color.value,
        opacity: 0.6,
      }),
      // Breathing waves
      h('path', {
        d: 'M 100 180 Q 150 160 200 180 T 300 180',
        stroke: color.value,
        'stroke-width': 2,
        fill: 'none',
        opacity: 0.8,
      }),
      h('text', { x: 200, y: 50, 'font-size': 18, fill: color.value, 'text-anchor': 'middle', 'font-weight': 'bold' }, 'Дыхание'),
    ]),
    temperature: () => h('g', [
      // Thermometer
      h('rect', { x: 180, y: 80, width: 40, height: 160, rx: 20, fill: '#e5e7eb' }),
      h('rect', { x: 185, y: 85, width: 30, height: 150, rx: 15, fill: color.value, opacity: 0.8 }),
      h('circle', { cx: 200, cy: 250, r: 25, fill: color.value, opacity: 0.8 }),
      h('circle', { cx: 200, cy: 250, r: 20, fill: '#ffffff' }),
      // Temperature indicator
      h('line', { x1: 200, y1: 100, x2: 200, y2: 120, stroke: '#ffffff', 'stroke-width': 3 }),
      h('text', { x: 200, y: 50, 'font-size': 18, fill: color.value, 'text-anchor': 'middle', 'font-weight': 'bold' }, 'Температура'),
    ]),
    sleep: () => h('g', [
      // Moon and stars
      h('path', {
        d: 'M 200 100 A 40 40 0 1 1 200 180 A 40 40 0 1 1 200 100',
        fill: color.value,
        opacity: 0.6,
      }),
      h('circle', { cx: 150, cy: 120, r: 3, fill: color.value }),
      h('circle', { cx: 250, cy: 130, r: 2, fill: color.value }),
      h('circle', { cx: 170, cy: 180, r: 2, fill: color.value }),
      h('circle', { cx: 230, cy: 190, r: 3, fill: color.value }),
      // Sleep waves
      h('path', {
        d: 'M 100 220 Q 150 210 200 220 T 300 220',
        stroke: color.value,
        'stroke-width': 2,
        fill: 'none',
        opacity: 0.6,
      }),
      h('text', { x: 200, y: 50, 'font-size': 18, fill: color.value, 'text-anchor': 'middle', 'font-weight': 'bold' }, 'Сон'),
    ]),
    emergency: () => h('g', [
      // Emergency cross
      h('rect', { x: 170, y: 100, width: 60, height: 60, rx: 8, fill: '#ffffff' }),
      h('rect', { x: 190, y: 110, width: 20, height: 40, fill: color.value }),
      h('rect', { x: 180, y: 120, width: 40, height: 20, fill: color.value }),
      // Alert circle
      h('circle', { cx: 200, cy: 200, r: 50, fill: color.value, opacity: 0.2 }),
      h('circle', { cx: 200, cy: 200, r: 35, fill: color.value, opacity: 0.3 }),
      h('text', { x: 200, y: 50, 'font-size': 18, fill: color.value, 'text-anchor': 'middle', 'font-weight': 'bold' }, 'Экстренная помощь'),
    ]),
  };
  return components[props.type] || components.fall;
});
</script>

<style scoped>
.health-illustration {
  width: 100%;
  height: 300px;
  margin-bottom: 1rem;
}

.health-illustration svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>





