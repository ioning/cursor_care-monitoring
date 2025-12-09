<template>
  <section class="glass-panel alerts">
    <header>
      <div>
        <h3>Критические алерты</h3>
        <p>Последние события, требующие внимания</p>
      </div>
      <button class="ghost" @click="$emit('ack-all')">Закрыть все</button>
    </header>

    <ul>
      <li v-for="alert in alerts" :key="alert.id">
        <TagPill :variant="alert.severity === 'critical' ? 'critical' : 'outline'">
          {{ alert.severity === 'critical' ? 'Критично' : 'Предупреждение' }}
        </TagPill>
        <div class="details">
          <p class="title">{{ alert.title }}</p>
          <small>{{ alert.service }} • {{ format(alert.detectedAt) }}</small>
        </div>
        <button class="ghost">Подробнее</button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';

import TagPill from '@/components/common/TagPill.vue';
import { useSystemStore } from '@/stores/system';

defineEmits<{ (e: 'ack-all'): void }>();

const systemStore = useSystemStore();
const { alerts } = storeToRefs(systemStore);

const format = (value: string) => new Intl.DateTimeFormat('ru-RU', { hour: 'numeric', minute: 'numeric' }).format(
  new Date(value),
);
</script>

<style scoped>
.alerts {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

li {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.details {
  flex: 1;
}

.title {
  margin: 0;
  font-weight: 600;
}

.ghost {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: #fff;
  border-radius: 10px;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
}
</style>

