<template>
  <span class="tag" :class="variant">
    <slot />
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'default' | 'outline' | 'critical';
  }>(),
  {
    variant: 'default',
  },
);
</script>

<style scoped>
.tag {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  border: 1px solid transparent;
}

.default {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.outline {
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
}

.critical {
  background: rgba(255, 122, 122, 0.15);
  color: #ff7a7a;
  border-color: rgba(255, 122, 122, 0.4);
}
</style>

