<template>
  <div class="table glass-panel">
    <table>
      <thead>
        <tr>
          <th>
            <input type="checkbox" :checked="store.allSelected" @change="toggleAll" />
          </th>
          <th>Имя</th>
          <th>Email</th>
          <th>Роль</th>
          <th>Статус</th>
          <th>Регион</th>
          <th>Активность</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in store.filtered" :key="user.id">
          <td>
            <input
              type="checkbox"
              :checked="store.selectedIds.has(user.id)"
              @change="store.toggleSelect(user.id)"
            />
          </td>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>
            <TagPill>{{ roles[user.role] }}</TagPill>
          </td>
          <td>
            <StatusBadge :status="statusColor[user.status]" />
          </td>
          <td>{{ user.region }}</td>
          <td>{{ format(user.lastActiveAt) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import TagPill from '@/components/common/TagPill.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import { useUsersStore } from '@/stores/users';

const store = useUsersStore();

const roles = {
  guardian: 'Опекун',
  dispatcher: 'Диспетчер',
  admin: 'Админ',
  operator: 'Оператор',
};

const statusColor = {
  active: 'ok',
  blocked: 'critical',
  pending: 'warning',
} as const;

const format = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

const toggleAll = (event: Event) => {
  const checked = (event.target as HTMLInputElement).checked;
  if (checked) store.selectAll();
  else store.clearSelection();
};
</script>

<style scoped>
.table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.75rem;
  text-align: left;
}

thead th {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

tbody tr {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

input[type='checkbox'] {
  transform: scale(1.1);
}
</style>

