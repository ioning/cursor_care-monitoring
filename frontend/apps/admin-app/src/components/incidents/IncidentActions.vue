<template>
  <section class="glass-panel actions">
    <header>
      <div>
        <h3>Действия</h3>
        <p>Шорткаты реагирования</p>
      </div>
      <select v-model="selectedIncident" @change="changeIncident">
        <option v-for="incident in list" :value="incident.id" :key="incident.id">
          {{ incident.id }} • {{ incident.title }}
        </option>
      </select>
    </header>

    <div class="grid">
      <button @click="store.runAction('scale_canary')">Канареечное развертывание</button>
      <button @click="store.runAction('reroute_traffic')">Перераспределить трафик</button>
      <button @click="store.runAction('escalate_ai')">Эскалация AI</button>
      <button @click="store.runAction('dispatch_team')">Назначить смену</button>
    </div>

    <div class="notes">
      <textarea v-model="note" placeholder="Add post-mortem note"></textarea>
      <button class="ghost" @click="addNote">Сохранить заметку</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { useIncidentsStore } from '@/stores/incidents';

const store = useIncidentsStore();
const { list, activeIncidentId } = storeToRefs(store);

const selectedIncident = ref<string | null>(null);
const note = ref('');

watch(
  () => activeIncidentId.value,
  (value) => {
    selectedIncident.value = value ?? null;
  },
  { immediate: true },
);

const changeIncident = () => {
  if (selectedIncident.value) {
    void store.loadTimeline(selectedIncident.value);
  }
};

const addNote = () => {
  if (!note.value) return;
  void store.runAction('add_note', { note: note.value });
  note.value = '';
};
</script>

<style scoped>
.actions {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

button {
  border: 0;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.notes {
  display: flex;
  gap: 0.75rem;
}

textarea {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: #fff;
  padding: 0.75rem;
  min-height: 80px;
}

.ghost {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
}
</style>

