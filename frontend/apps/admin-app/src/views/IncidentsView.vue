<template>
  <div class="incidents">
    <header>
      <div>
        <h2>Инциденты</h2>
        <p>Реакция на системные события в реальном времени</p>
      </div>
      <button class="primary" @click="store.runAction('open_post_mortem')">Создать пост-мортем</button>
    </header>

    <div class="grid">
      <IncidentActions />
      <IncidentTimeline />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import IncidentActions from '@/components/incidents/IncidentActions.vue';
import IncidentTimeline from '@/components/incidents/IncidentTimeline.vue';
import { useIncidentsStore } from '@/stores/incidents';

const store = useIncidentsStore();

onMounted(async () => {
  if (!store.list.length) {
    await store.loadIncidents();
    if (store.activeIncidentId) {
      await store.loadTimeline(store.activeIncidentId);
    }
  }
});
</script>

<style scoped>
.incidents {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.primary {
  border: 0;
  border-radius: 10px;
  padding: 0.65rem 1.25rem;
  background: linear-gradient(135deg, #f97316, #ef4444);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
</style>

