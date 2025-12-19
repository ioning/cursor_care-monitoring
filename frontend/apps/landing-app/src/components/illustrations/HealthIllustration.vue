<template>
  <div class="health-illustration">
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient :id="`healthGradient-${type}`" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :style="`stop-color:${color};stop-opacity:0.1`" />
          <stop offset="100%" :style="`stop-color:${color};stop-opacity:0.3`" />
        </linearGradient>

        <!-- Soft shadow -->
        <filter :id="`softShadow-${type}`" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#0f172a" flood-opacity="0.18" />
        </filter>

        <!-- Subtle dot pattern (premium texture) -->
        <pattern :id="`dots-${type}`" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" :fill="color" opacity="0.10" />
        </pattern>
      </defs>
      
      <!-- Background -->
      <rect width="400" height="300" rx="18" :fill="`url(#healthGradient-${type})`" />
      <rect width="400" height="300" rx="18" :fill="`url(#dots-${type})`" opacity="0.75" />

      <!-- Inner border -->
      <rect x="10" y="10" width="380" height="280" rx="16" fill="none" stroke="#ffffff" opacity="0.55" />

      <!-- Icon group -->
      <g :filter="`url(#softShadow-${type})`">
        <component :is="illustrationComponent" />
      </g>
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
  const stroke = 'rgba(15, 23, 42, 0.55)';
  const strokeStrong = 'rgba(15, 23, 42, 0.75)';
  const line = { stroke, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' as const };
  const lineThin = { stroke, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' as const };

  const components: Record<string, any> = {
    fall: () => h('g', [
      // Soft blob behind
      h('circle', { cx: 200, cy: 150, r: 86, fill: color.value, opacity: 0.14 }),
      h('circle', { cx: 200, cy: 150, r: 64, fill: color.value, opacity: 0.10 }),

      // Minimal person
      h('circle', { cx: 205, cy: 118, r: 18, fill: '#ffffff', opacity: 0.85 }),
      h('circle', { cx: 205, cy: 118, r: 18, fill: color.value, opacity: 0.18 }),
      h('path', { d: 'M 210 140 L 190 178', ...line }),
      h('path', { d: 'M 190 178 L 168 204', ...line }),
      h('path', { d: 'M 190 178 L 210 206', ...line }),
      h('path', { d: 'M 203 158 L 178 168', ...lineThin }),
      h('path', { d: 'M 203 158 L 226 174', ...lineThin }),

      // Warning marker
      h('path', { d: 'M 150 86 L 110 156 L 190 156 Z', fill: color.value, opacity: 0.92 }),
      h('path', { d: 'M 150 98 L 126 146 L 174 146 Z', fill: '#ffffff', opacity: 0.18 }),
      h('path', { d: 'M 150 112 L 150 134', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round' }),
      h('circle', { cx: 150, cy: 145, r: 3.2, fill: '#fff' }),
    ]),
    heart: () => h('g', [
      // Soft blob behind
      h('circle', { cx: 200, cy: 150, r: 88, fill: color.value, opacity: 0.14 }),
      h('circle', { cx: 200, cy: 150, r: 66, fill: color.value, opacity: 0.10 }),

      // Proper heart shape (classic, symmetric)
      h('path', {
        d: 'M 200 208 C 188 196 158 174 146 150 C 132 120 152 98 176 104 C 190 108 197 120 200 128 C 203 120 210 108 224 104 C 248 98 268 120 254 150 C 242 174 212 196 200 208 Z',
        fill: color.value,
        opacity: 0.92,
      }),
      h('path', {
        d: 'M 176 112 C 160 110 148 124 150 142 C 152 154 160 166 176 176',
        stroke: '#ffffff',
        'stroke-width': 5,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        opacity: 0.18,
        fill: 'none',
      }),

      // ECG line (more premium)
      h('path', {
        d: 'M 104 214 H 132 L 144 188 L 158 224 L 176 202 L 190 238 L 206 164 L 222 224 L 238 206 L 252 214 H 296',
        stroke: color.value,
        'stroke-width': 3,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        fill: 'none',
        opacity: 0.95,
      }),
    ]),
    breathing: () => h('g', [
      h('circle', { cx: 200, cy: 150, r: 88, fill: color.value, opacity: 0.12 }),
      // Trachea
      h('path', { d: 'M 200 86 V 128', ...line }),
      h('path', { d: 'M 200 128 C 200 138 190 140 184 148', ...lineThin }),
      h('path', { d: 'M 200 128 C 200 138 210 140 216 148', ...lineThin }),

      // Lungs (outline + duotone fill)
      h('path', {
        d: 'M 176 124 C 150 132 136 156 140 186 C 144 214 164 230 184 224 C 192 222 196 214 196 204 V 146 C 196 134 188 122 176 124 Z',
        fill: color.value,
        opacity: 0.28,
      }),
      h('path', {
        d: 'M 224 124 C 250 132 264 156 260 186 C 256 214 236 230 216 224 C 208 222 204 214 204 204 V 146 C 204 134 212 122 224 124 Z',
        fill: color.value,
        opacity: 0.28,
      }),
      h('path', {
        d: 'M 176 124 C 150 132 136 156 140 186 C 144 214 164 230 184 224 C 192 222 196 214 196 204 V 146 C 196 134 188 122 176 124 Z',
        stroke: strokeStrong,
        'stroke-width': 2.5,
        fill: 'none',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        opacity: 0.9,
      }),
      h('path', {
        d: 'M 224 124 C 250 132 264 156 260 186 C 256 214 236 230 216 224 C 208 222 204 214 204 204 V 146 C 204 134 212 122 224 124 Z',
        stroke: strokeStrong,
        'stroke-width': 2.5,
        fill: 'none',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        opacity: 0.9,
      }),

      // Breath waves
      h('path', { d: 'M 110 208 C 140 194 170 194 200 208 C 230 222 260 222 290 208', ...lineThin, opacity: 0.75 }),
    ]),
    temperature: () => h('g', [
      h('circle', { cx: 200, cy: 150, r: 88, fill: color.value, opacity: 0.12 }),
      // Outer thermometer
      h('rect', { x: 182, y: 74, width: 36, height: 150, rx: 18, fill: '#ffffff', opacity: 0.85 }),
      h('rect', { x: 182, y: 74, width: 36, height: 150, rx: 18, fill: color.value, opacity: 0.12 }),
      h('rect', { x: 182, y: 74, width: 36, height: 150, rx: 18, fill: 'none', stroke: strokeStrong, 'stroke-width': 2 }),

      // Mercury
      h('rect', { x: 195, y: 106, width: 10, height: 100, rx: 6, fill: color.value, opacity: 0.9 }),
      h('circle', { cx: 200, cy: 232, r: 22, fill: color.value, opacity: 0.92 }),
      h('circle', { cx: 200, cy: 232, r: 22, fill: 'none', stroke: strokeStrong, 'stroke-width': 2 }),

      // Tick marks
      h('path', { d: 'M 226 108 H 238', ...lineThin, opacity: 0.55 }),
      h('path', { d: 'M 226 132 H 242', ...lineThin, opacity: 0.55 }),
      h('path', { d: 'M 226 156 H 238', ...lineThin, opacity: 0.55 }),
      h('path', { d: 'M 226 180 H 242', ...lineThin, opacity: 0.55 }),
    ]),
    sleep: () => h('g', [
      h('circle', { cx: 200, cy: 150, r: 88, fill: color.value, opacity: 0.12 }),

      // Crescent moon (two circles)
      h('circle', { cx: 210, cy: 140, r: 44, fill: color.value, opacity: 0.9 }),
      h('circle', { cx: 228, cy: 128, r: 42, fill: '#ffffff', opacity: 0.88 }),
      h('circle', { cx: 210, cy: 140, r: 44, fill: 'none', stroke: strokeStrong, 'stroke-width': 2, opacity: 0.25 }),

      // Stars
      h('path', { d: 'M 130 112 L 134 124 L 146 128 L 134 132 L 130 144 L 126 132 L 114 128 L 126 124 Z', fill: '#ffffff', opacity: 0.7 }),
      h('circle', { cx: 156, cy: 170, r: 3, fill: '#ffffff', opacity: 0.7 }),
      h('circle', { cx: 268, cy: 186, r: 2.6, fill: '#ffffff', opacity: 0.7 }),

      // Calm wave
      h('path', { d: 'M 112 214 C 144 200 168 200 200 214 C 232 228 256 228 288 214', ...lineThin, opacity: 0.6 }),
    ]),
    emergency: () => h('g', [
      h('circle', { cx: 200, cy: 150, r: 88, fill: color.value, opacity: 0.12 }),

      // Medical card
      h('rect', { x: 140, y: 96, width: 120, height: 104, rx: 18, fill: '#ffffff', opacity: 0.9 }),
      h('rect', { x: 140, y: 96, width: 120, height: 104, rx: 18, fill: color.value, opacity: 0.10 }),
      h('rect', { x: 140, y: 96, width: 120, height: 104, rx: 18, fill: 'none', stroke: strokeStrong, 'stroke-width': 2 }),

      // Cross
      h('rect', { x: 193, y: 116, width: 14, height: 64, rx: 7, fill: color.value, opacity: 0.95 }),
      h('rect', { x: 168, y: 141, width: 64, height: 14, rx: 7, fill: color.value, opacity: 0.95 }),

      // Siren lines
      h('path', { d: 'M 104 170 C 92 154 92 132 104 116', ...lineThin, opacity: 0.55 }),
      h('path', { d: 'M 296 170 C 308 154 308 132 296 116', ...lineThin, opacity: 0.55 }),
    ]),
  };
  return components[props.type] || components.fall;
});
</script>

<style scoped>
.health-illustration {
  width: 100%;
  height: 240px;
  margin-bottom: 1rem;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.10);
}

.health-illustration svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>





