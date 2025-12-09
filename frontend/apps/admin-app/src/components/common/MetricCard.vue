<template>
  <div class="metric-card glass-panel">
    <div class="meta">
      <p class="label">{{ label }}</p>
      <slot name="extra"></slot>
    </div>
    <div class="value-row">
      <h3>{{ value }}</h3>
      <span :class="['delta', delta >= 0 ? 'up' : 'down']">
        {{ delta >= 0 ? '+' : '' }}{{ delta }}%
      </span>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  delta: number;
}>();
</script>

<style scoped>
.metric-card {
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  margin: 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.6);
}

.value-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

h3 {
  margin: 0;
  font-size: 1.85rem;
}

.delta {
  font-weight: 700;
}

.delta.up {
  color: #4ade80;
}

.delta.down {
  color: #f87171;
}
</style>

