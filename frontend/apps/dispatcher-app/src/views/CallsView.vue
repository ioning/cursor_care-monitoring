<template>
  <div class="calls-view">
    <div class="view-header">
      <h1>Вызовы экстренных служб</h1>
      <div class="view-actions">
        <select v-model="statusFilter" @change="applyFilters" class="filter-select">
          <option value="">Все статусы</option>
          <option value="created">Создан</option>
          <option value="assigned">Назначен</option>
          <option value="in_progress">В работе</option>
          <option value="resolved">Завершен</option>
          <option value="canceled">Отменен</option>
        </select>
        <select v-model="priorityFilter" @change="applyFilters" class="filter-select">
          <option value="">Все приоритеты</option>
          <option value="critical">Критичный</option>
          <option value="high">Высокий</option>
          <option value="medium">Средний</option>
          <option value="low">Низкий</option>
        </select>
        <button @click="refreshCalls" class="btn btn-primary" :disabled="isLoading">
          Обновить
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading">Загрузка вызовов...</div>
    <div v-else-if="filteredCalls.length === 0" class="empty">Нет вызовов</div>
    <div v-else class="calls-table">
      <table>
        <thead>
          <tr>
            <th>Время</th>
            <th>Подопечный</th>
            <th>Тип вызова</th>
            <th>Приоритет</th>
            <th>Статус</th>
            <th>Диспетчер</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="call in filteredCalls"
            :key="call.id"
            class="call-row"
            :class="`priority-${call.priority}`"
            @click="selectCall(call)"
          >
            <td>{{ formatTime(call.createdAt) }}</td>
            <td>{{ call.ward?.fullName || 'Неизвестно' }}</td>
            <td>{{ call.healthSnapshot?.alertType || call.callType }}</td>
            <td>
              <span class="badge" :class="`badge-${call.priority}`">
                {{ call.priority }}
              </span>
            </td>
            <td>
              <span :class="`status-${call.status}`">{{ getStatusLabel(call.status) }}</span>
            </td>
            <td>{{ call.dispatcherId ? 'Назначен' : 'Не назначен' }}</td>
            <td @click.stop>
              <div class="action-buttons">
                <button
                  v-if="call.status === 'created'"
                  @click="handleAssign(call.id)"
                  class="btn btn-primary btn-sm"
                >
                  Принять
                </button>
                <button
                  v-if="call.status === 'assigned' || call.status === 'in_progress'"
                  @click="handleResolve(call.id)"
                  class="btn btn-success btn-sm"
                >
                  Завершить
                </button>
                <router-link
                  :to="`/calls/${call.id}`"
                  class="btn btn-secondary btn-sm"
                >
                  Детали
                </router-link>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Пагинация -->
    <div v-if="total > filters.limit" class="pagination">
      <button
        @click="loadPage(filters.page! - 1)"
        :disabled="filters.page === 1"
        class="btn btn-secondary"
      >
        Назад
      </button>
      <span>Страница {{ filters.page }} из {{ Math.ceil(total / filters.limit!) }}</span>
      <button
        @click="loadPage(filters.page! + 1)"
        :disabled="filters.page! * filters.limit! >= total"
        class="btn btn-secondary"
      >
        Вперед
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useCallsStore } from '../stores/calls';

const router = useRouter();
const callsStore = useCallsStore();

const statusFilter = ref('');
const priorityFilter = ref('');

const { calls, filters, total, isLoading } = callsStore;

const filteredCalls = computed(() => {
  let result = calls;
  
  if (statusFilter.value) {
    result = result.filter((call) => call.status === statusFilter.value);
  }
  
  if (priorityFilter.value) {
    result = result.filter((call) => call.priority === priorityFilter.value);
  }
  
  return result;
});

function formatTime(dateString: string) {
  return format(new Date(dateString), 'dd.MM.yyyy HH:mm:ss', { locale: ru });
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    created: 'Создан',
    assigned: 'Назначен',
    in_progress: 'В работе',
    resolved: 'Завершен',
    canceled: 'Отменен',
  };
  return labels[status] || status;
}

function selectCall(call: any) {
  router.push(`/calls/${call.id}`);
}

async function handleAssign(callId: string) {
  try {
    await callsStore.assignCall(callId);
    await refreshCalls();
  } catch (error) {
    console.error('Failed to assign call:', error);
  }
}

async function handleResolve(callId: string) {
  try {
    await callsStore.updateCallStatus(callId, 'resolved');
    await refreshCalls();
  } catch (error) {
    console.error('Failed to resolve call:', error);
  }
}

function applyFilters() {
  const newFilters: any = {};
  if (statusFilter.value) newFilters.status = statusFilter.value;
  if (priorityFilter.value) newFilters.priority = priorityFilter.value;
  callsStore.fetchCalls(newFilters);
}

function loadPage(page: number) {
  callsStore.fetchCalls({ ...filters, page });
}

async function refreshCalls() {
  await callsStore.fetchCalls(filters);
}

onMounted(() => {
  refreshCalls();
});
</script>

<style scoped>
.calls-view {
  max-width: 1400px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.view-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.calls-table {
  background: var(--card-bg);
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: var(--shadow);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: var(--bg-color);
}

th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-color);
}

td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.call-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.call-row:hover {
  background-color: var(--bg-color);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.loading,
.empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}
</style>

