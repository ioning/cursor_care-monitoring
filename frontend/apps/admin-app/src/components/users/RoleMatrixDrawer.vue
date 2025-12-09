<template>
  <div class="drawer" :class="{ open }">
    <div class="drawer-content glass-panel">
      <header>
        <h3>Матрица ролей</h3>
        <button class="ghost" @click="emit('close')">Закрыть</button>
      </header>
      <table>
        <thead>
          <tr>
            <th>Permission</th>
            <th v-for="role in roles" :key="role.key">{{ role.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="permission in permissions" :key="permission.key">
            <td>{{ permission.label }}</td>
            <td v-for="role in roles" :key="role.key">
              <input
                type="checkbox"
                :checked="matrix[role.key].has(permission.key)"
                @change="toggle(role.key, permission.key)"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <footer>
        <button class="ghost" @click="emit('close')">Отмена</button>
        <button class="primary">Сохранить</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const roles = [
  { key: 'guardian', label: 'Опекун' },
  { key: 'dispatcher', label: 'Диспетчер' },
  { key: 'operator', label: 'Оператор' },
  { key: 'admin', label: 'Администратор' },
];

const permissions = [
  { key: 'view_telemetry', label: 'Просмотр телеметрии' },
  { key: 'manage_users', label: 'Управление пользователями' },
  { key: 'manage_billing', label: 'Управление биллингом' },
  { key: 'ai_override', label: 'Управление AI-моделями' },
];

const matrix = reactive(
  roles.reduce<Record<string, Set<string>>>((acc, role, idx) => {
    acc[role.key] = new Set(permissions.filter((_, pIdx) => pIdx <= idx).map((p) => p.key));
    return acc;
  }, {}),
);

const toggle = (roleKey: string, permissionKey: string) => {
  const bucket = matrix[roleKey];
  if (bucket.has(permissionKey)) bucket.delete(permissionKey);
  else bucket.add(permissionKey);
};
</script>

<style scoped>
.drawer {
  position: fixed;
  inset: 0;
  background: rgba(5, 9, 18, 0.75);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.drawer.open {
  opacity: 1;
  pointer-events: auto;
}

.drawer-content {
  position: absolute;
  right: 0;
  top: 0;
  height: 100vh;
  width: 520px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

footer {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.ghost,
.primary {
  border: 0;
  border-radius: 10px;
  padding: 0.6rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
}

.ghost {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.primary {
  background: linear-gradient(135deg, #8c5eff, #3d7fff);
  color: #fff;
}
</style>

