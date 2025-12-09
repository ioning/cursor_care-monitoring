<template>
  <div class="users">
    <header>
      <div>
        <h2>Управление пользователями</h2>
        <p>Массовые операции, фильтры и аудит</p>
      </div>
      <div class="header-actions">
        <button class="ghost" @click="store.export('csv')">Экспорт CSV</button>
        <button class="primary" @click="store.export('xlsx')">Экспорт XLSX</button>
      </div>
    </header>

    <UserFilters @refresh="store.load" />
    <BulkActionsBar @open-role-matrix="drawerOpen = true" />
    <UserTable />

    <RoleMatrixDrawer :open="drawerOpen" @close="drawerOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import BulkActionsBar from '@/components/users/BulkActionsBar.vue';
import RoleMatrixDrawer from '@/components/users/RoleMatrixDrawer.vue';
import UserFilters from '@/components/users/UserFilters.vue';
import UserTable from '@/components/users/UserTable.vue';
import { useUsersStore } from '@/stores/users';

const store = useUsersStore();
const drawerOpen = ref(false);

onMounted(() => {
  if (!store.items.length) {
    void store.load();
  }
});
</script>

<style scoped>
.users {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.ghost,
.primary {
  border: 0;
  border-radius: 10px;
  padding: 0.6rem 1rem;
  font-weight: 600;
  cursor: pointer;
}

.ghost {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.primary {
  background: linear-gradient(135deg, #3d7fff, #8c5eff);
  color: #fff;
}
</style>

