<template>
  <span class="badge" :class="status">
    {{ labels[status] }}
  </span>
</template>

<script setup lang="ts">
type Status = 'ok' | 'warning' | 'critical' | 'info';

defineProps<{
  status: Status;
}>();

const labels: Record<Status, string> = {
  ok: 'Норма',
  warning: 'Внимание',
  critical: 'Критично',
  info: 'Инфо',
};
</script>

<style scoped>
.badge {
  padding: 0.2rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ok {
  background: rgba(61, 214, 149, 0.15);
  color: #3dd695;
}

.warning {
  background: rgba(255, 193, 79, 0.15);
  color: #ffc14f;
}

.critical {
  background: rgba(255, 122, 122, 0.15);
  color: #ff7a7a;
}

.info {
  background: rgba(85, 189, 255, 0.15);
  color: #55bdff;
}
</style>

