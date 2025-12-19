<template>
  <div class="feature-illustration">
    <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient :id="`gradient-${type}`" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :style="`stop-color:${colors[0]};stop-opacity:0.10`" />
          <stop offset="100%" :style="`stop-color:${colors[1]};stop-opacity:0.22`" />
        </linearGradient>

        <filter :id="`softShadow-${type}`" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#0f172a" flood-opacity="0.16" />
        </filter>

        <pattern :id="`dots-${type}`" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.1" :fill="colors[0]" opacity="0.10" />
        </pattern>
      </defs>
      
      <rect width="300" height="200" rx="16" :fill="`url(#gradient-${type})`" />
      <rect width="300" height="200" rx="16" :fill="`url(#dots-${type})`" opacity="0.8" />
      <rect x="8" y="8" width="284" height="184" rx="14" fill="none" stroke="#ffffff" opacity="0.55" />
      
      <g :filter="`url(#softShadow-${type})`">
        <component :is="illustrationComponent" />
      </g>
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
  const stroke = 'rgba(15, 23, 42, 0.60)';
  const strokeStrong = 'rgba(15, 23, 42, 0.78)';
  const lineThin = { stroke, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' as const };

  const components: Record<string, any> = {
    telemetry: () => h('g', [
      h('circle', { cx: 150, cy: 110, r: 70, fill: colors.value[0], opacity: 0.12 }),
      // Chart card
      h('rect', { x: 48, y: 70, width: 204, height: 92, rx: 16, fill: '#ffffff', opacity: 0.92 }),
      h('rect', { x: 48, y: 70, width: 204, height: 92, rx: 16, fill: colors.value[1], opacity: 0.08 }),
      h('rect', { x: 48, y: 70, width: 204, height: 92, rx: 16, fill: 'none', stroke: strokeStrong, 'stroke-width': 2, opacity: 0.22 }),
      h('path', {
        d: 'M 62 138 L 84 120 L 102 128 L 124 102 L 146 112 L 166 92 L 184 104 L 206 82 L 232 92',
        stroke: colors.value[0],
        'stroke-width': 3,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        fill: 'none',
      }),
      h('circle', { cx: 62, cy: 138, r: 4, fill: colors.value[0] }),
      h('circle', { cx: 232, cy: 92, r: 4, fill: colors.value[0] }),
      // subtle grid lines
      h('path', { d: 'M 72 92 H 228', ...lineThin, opacity: 0.18 }),
      h('path', { d: 'M 72 118 H 228', ...lineThin, opacity: 0.14 }),
    ]),
    ai: () => h('g', [
      h('circle', { cx: 150, cy: 110, r: 72, fill: colors.value[0], opacity: 0.12 }),
      // Chip / brain core
      h('rect', { x: 108, y: 70, width: 84, height: 84, rx: 20, fill: '#ffffff', opacity: 0.92 }),
      h('rect', { x: 108, y: 70, width: 84, height: 84, rx: 20, fill: colors.value[1], opacity: 0.10 }),
      h('rect', { x: 108, y: 70, width: 84, height: 84, rx: 20, fill: 'none', stroke: strokeStrong, 'stroke-width': 2, opacity: 0.25 }),

      // Nodes
      h('circle', { cx: 132, cy: 92, r: 4, fill: colors.value[0], opacity: 0.95 }),
      h('circle', { cx: 168, cy: 92, r: 4, fill: colors.value[0], opacity: 0.95 }),
      h('circle', { cx: 132, cy: 132, r: 4, fill: colors.value[0], opacity: 0.95 }),
      h('circle', { cx: 168, cy: 132, r: 4, fill: colors.value[0], opacity: 0.95 }),
      h('circle', { cx: 150, cy: 112, r: 4, fill: colors.value[0], opacity: 0.95 }),

      // Connections
      h('path', { d: 'M 132 92 L 150 112 L 168 92', ...lineThin, opacity: 0.55 }),
      h('path', { d: 'M 132 132 L 150 112 L 168 132', ...lineThin, opacity: 0.55 }),
      h('path', { d: 'M 132 92 L 132 132', ...lineThin, opacity: 0.40 }),
      h('path', { d: 'M 168 92 L 168 132', ...lineThin, opacity: 0.40 }),
    ]),
    emergency: () => h('g', [
      h('circle', { cx: 150, cy: 110, r: 72, fill: colors.value[0], opacity: 0.12 }),
      // Siren / alert card
      h('rect', { x: 96, y: 72, width: 108, height: 92, rx: 18, fill: '#ffffff', opacity: 0.92 }),
      h('rect', { x: 96, y: 72, width: 108, height: 92, rx: 18, fill: colors.value[0], opacity: 0.10 }),
      h('rect', { x: 96, y: 72, width: 108, height: 92, rx: 18, fill: 'none', stroke: strokeStrong, 'stroke-width': 2, opacity: 0.22 }),

      h('path', { d: 'M 128 112 H 172', stroke: colors.value[0], 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.95 }),
      h('circle', { cx: 150, cy: 112, r: 12, fill: colors.value[1], opacity: 0.35 }),
      // exclamation mark
      h('path', { d: 'M 150 86 V 104', stroke: colors.value[0], 'stroke-width': 5, 'stroke-linecap': 'round' }),
      h('circle', { cx: 150, cy: 114, r: 3.2, fill: colors.value[0] }),

      // Sound waves
      h('path', { d: 'M 82 124 C 74 114 74 98 82 88', ...lineThin, opacity: 0.40 }),
      h('path', { d: 'M 218 124 C 226 114 226 98 218 88', ...lineThin, opacity: 0.40 }),
    ]),
    location: () => h('g', [
      h('circle', { cx: 150, cy: 112, r: 72, fill: colors.value[0], opacity: 0.10 }),
      // Rings
      h('circle', { cx: 150, cy: 140, r: 34, fill: colors.value[1], opacity: 0.14 }),
      h('circle', { cx: 150, cy: 140, r: 22, fill: colors.value[1], opacity: 0.10 }),

      // Pin (modern)
      h('path', {
        d: 'M 150 72 C 130 72 116 86 116 106 C 116 132 150 156 150 156 C 150 156 184 132 184 106 C 184 86 170 72 150 72 Z',
        fill: colors.value[0],
        opacity: 0.92,
      }),
      h('circle', { cx: 150, cy: 106, r: 10, fill: '#ffffff', opacity: 0.9 }),
      h('circle', { cx: 150, cy: 106, r: 10, fill: colors.value[1], opacity: 0.18 }),
      h('path', { d: 'M 150 156 V 168', ...lineThin, opacity: 0.35 }),
    ]),
    mobile: () => h('g', [
      h('circle', { cx: 150, cy: 110, r: 72, fill: colors.value[0], opacity: 0.10 }),
      // Phone body
      h('rect', { x: 112, y: 54, width: 76, height: 132, rx: 18, fill: '#0f172a', opacity: 0.92 }),
      h('rect', { x: 112, y: 54, width: 76, height: 132, rx: 18, fill: colors.value[0], opacity: 0.12 }),
      h('rect', { x: 112, y: 54, width: 76, height: 132, rx: 18, fill: 'none', stroke: strokeStrong, 'stroke-width': 2, opacity: 0.25 }),
      // Screen
      h('rect', { x: 120, y: 70, width: 60, height: 92, rx: 12, fill: '#ffffff', opacity: 0.92 }),
      h('rect', { x: 120, y: 70, width: 60, height: 92, rx: 12, fill: colors.value[1], opacity: 0.10 }),
      // UI dots
      h('circle', { cx: 132, cy: 88, r: 4, fill: colors.value[0], opacity: 0.9 }),
      h('rect', { x: 142, y: 84, width: 32, height: 8, rx: 4, fill: colors.value[0], opacity: 0.25 }),
      h('rect', { x: 132, y: 102, width: 46, height: 8, rx: 4, fill: colors.value[1], opacity: 0.20 }),
      h('rect', { x: 132, y: 118, width: 40, height: 8, rx: 4, fill: colors.value[1], opacity: 0.18 }),
      // Button
      h('circle', { cx: 150, cy: 176, r: 6, fill: colors.value[0], opacity: 0.9 }),
    ]),
    analytics: () => h('g', [
      h('circle', { cx: 150, cy: 110, r: 72, fill: colors.value[0], opacity: 0.10 }),
      // Chart frame
      h('rect', { x: 82, y: 70, width: 136, height: 100, rx: 18, fill: '#ffffff', opacity: 0.92 }),
      h('rect', { x: 82, y: 70, width: 136, height: 100, rx: 18, fill: colors.value[1], opacity: 0.08 }),
      h('rect', { x: 82, y: 70, width: 136, height: 100, rx: 18, fill: 'none', stroke: strokeStrong, 'stroke-width': 2, opacity: 0.22 }),

      // Bars with rounded corners
      h('rect', { x: 104, y: 122, width: 16, height: 34, rx: 8, fill: colors.value[0], opacity: 0.95 }),
      h('rect', { x: 128, y: 106, width: 16, height: 50, rx: 8, fill: colors.value[1], opacity: 0.85 }),
      h('rect', { x: 152, y: 96, width: 16, height: 60, rx: 8, fill: colors.value[0], opacity: 0.95 }),
      h('rect', { x: 176, y: 112, width: 16, height: 44, rx: 8, fill: colors.value[1], opacity: 0.85 }),

      // Trend line
      h('path', { d: 'M 104 114 L 136 104 L 160 92 L 192 104', stroke: colors.value[0], 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none', opacity: 0.65 }),
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
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.10);
}

.feature-illustration svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>






