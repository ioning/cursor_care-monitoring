<template>
  <section class="glass-panel timeline">
    <header>
      <div>
        <h3>Хронология</h3>
        <p v-if="incident">INC {{ incident.id }} • {{ incident.title }}</p>
      </div>
      <div class="sli">
        <span>Риск SLO</span>
        <strong>{{ (incident?.sloBreachRisk ?? 0) * 100 }}%</strong>
      </div>
    </header>

    <ul>
      <li v-for="event in timeline" :key="event.id">
        <div class="time">{{ format(event.at) }}</div>
        <div class="content">
          <TagPill :variant="variant[event.type]">{{ labels[event.type] }}</TagPill>
          <p>{{ event.description }}</p>
          <small>{{ event.author }}</small>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import TagPill from '@/components/common/TagPill.vue';
import { useIncidentsStore } from '@/stores/incidents';

const store = useIncidentsStore();
const { timeline, list, activeIncidentId } = storeToRefs(store);

const incident = computed(() => list.value.find((item) => item.id === activeIncidentId.value));

const labels = {
  alert: 'Алерт',
  action: 'Действие',
  note: 'Заметка',
} as const;

const variant = {
  alert: 'critical',
  action: 'default',
  note: 'outline',
} as const;

const format = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', { hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(new Date(value));
</script>

<style scoped>
.timeline {
  padding: 1.5rem;
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
  gap: 1rem;
}

li {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 1rem;
}

.time {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  text-align: right;
}

.content {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 0.75rem 1rem;
}

p {
  margin: 0.5rem 0;
}
</style>

