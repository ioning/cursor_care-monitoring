<template>
  <div class="filters glass-panel">
    <input
      v-model="filters.query"
      type="search"
      placeholder="Поиск по имени, email, ID"
    />

    <select v-model="filters.role">
      <option value="all">Все роли</option>
      <option value="guardian">Опекун</option>
      <option value="dispatcher">Диспетчер</option>
      <option value="operator">Оператор</option>
      <option value="admin">Администратор</option>
    </select>

    <select v-model="filters.status">
      <option value="all">Все статусы</option>
      <option value="active">Активные</option>
      <option value="blocked">Заблокированные</option>
      <option value="pending">Ожидают</option>
    </select>

    <button class="ghost" @click="emit('refresh')">Применить</button>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useUsersStore } from '@/stores/users';

const emit = defineEmits<{ (e: 'refresh'): void }>();

const store = useUsersStore();
const { filters } = storeToRefs(store);
</script>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  padding: 0.75rem;
}

input,
select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
}

.ghost {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: #fff;
  background: transparent;
  cursor: pointer;
}
</style>

