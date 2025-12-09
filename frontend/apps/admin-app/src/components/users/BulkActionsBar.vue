<template>
  <div class="bulk glass-panel" v-if="selectedCount">
    <div>
      <strong>{{ selectedCount }}</strong>
      <span>пользователей выбрано</span>
    </div>
    <div class="actions">
      <button @click="store.bulkRoleChange('guardian')">Назначить опекунов</button>
      <button @click="store.bulkRoleChange('dispatcher')">Назначить диспетчеров</button>
      <button class="danger" @click="emit('open-role-matrix')">Матрица прав</button>
    </div>
    <button class="ghost" @click="store.clearSelection">Отменить</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useUsersStore } from '@/stores/users';

const store = useUsersStore();
const emit = defineEmits<{ (e: 'open-role-matrix'): void }>();

const selectedCount = computed(() => store.selectedIds.size);
</script>

<style scoped>
.bulk {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

button {
  border: 0;
  border-radius: 10px;
  padding: 0.5rem 0.9rem;
  cursor: pointer;
  font-weight: 600;
}

.danger {
  background: rgba(255, 122, 122, 0.15);
  color: #ff7a7a;
}

.ghost {
  margin-left: auto;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}
</style>

