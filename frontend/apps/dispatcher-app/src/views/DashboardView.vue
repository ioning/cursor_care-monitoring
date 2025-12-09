<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Панель управления</h1>
      <button @click="refreshData" class="btn btn-primary" :disabled="isLoading">
        Обновить
      </button>
    </div>

    <!-- Статистика -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">Всего вызовов</div>
        <div class="stat-trend" v-if="stats.byStatus">
          <span class="trend-up">↑</span>
          <span class="trend-value">{{ stats.byStatus.created || 0 }} новых</span>
        </div>
      </div>
      <div class="stat-card priority-critical">
        <div class="stat-value">{{ criticalCalls.length }}</div>
        <div class="stat-label">Критичные</div>
        <div class="stat-trend">
          <span class="trend-critical">⚠</span>
          <span class="trend-value">Требуют внимания</span>
        </div>
      </div>
      <div class="stat-card status-in_progress">
        <div class="stat-value">{{ activeCalls.length }}</div>
        <div class="stat-label">Активные</div>
        <div class="stat-trend">
          <span class="trend-value">{{ stats.byStatus.in_progress || 0 }} в работе</span>
        </div>
      </div>
      <div class="stat-card status-resolved">
        <div class="stat-value">{{ stats.byStatus.resolved || 0 }}</div>
        <div class="stat-label">Завершено</div>
        <div class="stat-trend">
          <span class="trend-success">✓</span>
          <span class="trend-value">{{ getTodayResolved() }} сегодня</span>
        </div>
      </div>
      <div class="stat-card priority-high">
        <div class="stat-value">{{ stats.byPriority?.high || 0 }}</div>
        <div class="stat-label">Высокий приоритет</div>
      </div>
      <div class="stat-card status-assigned">
        <div class="stat-value">{{ stats.byStatus.assigned || 0 }}</div>
        <div class="stat-label">Назначено</div>
      </div>
    </div>

    <!-- Критичные вызовы -->
    <div v-if="criticalCalls.length > 0" class="section">
      <h2>🚨 Критичные вызовы</h2>
      <div class="calls-list">
        <div
          v-for="call in criticalCalls"
          :key="call.id"
          class="call-card priority-critical"
          @click="selectCall(call)"
        >
          <div class="call-header">
            <span class="badge badge-critical">{{ call.priority }}</span>
            <span class="status-created">{{ call.status }}</span>
          </div>
          <div class="call-body">
            <h3>{{ call.ward?.fullName || 'Неизвестный подопечный' }}</h3>
            <p>{{ call.healthSnapshot?.alertType || 'Экстренный вызов' }}</p>
            <p class="call-time">{{ formatTime(call.createdAt) }}</p>
          </div>
          <div class="call-actions">
            <button
              @click.stop="handleAssign(call.id)"
              class="btn btn-primary"
              v-if="call.status === 'created'"
            >
              Принять
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Активные вызовы -->
    <div class="section">
      <h2>Активные вызовы</h2>
      <div v-if="isLoading" class="loading">Загрузка...</div>
      <div v-else-if="activeCalls.length === 0" class="empty">
        Нет активных вызовов
      </div>
      <div v-else class="calls-list">
        <div
          v-for="call in activeCalls.slice(0, 10)"
          :key="call.id"
          class="call-card"
          :class="`priority-${call.priority}`"
          @click="selectCall(call)"
        >
          <div class="call-header">
            <span class="badge" :class="`badge-${call.priority}`">{{ call.priority }}</span>
            <span :class="`status-${call.status}`">{{ call.status }}</span>
          </div>
          <div class="call-body">
            <h3>{{ call.ward?.fullName || 'Неизвестный подопечный' }}</h3>
            <p>{{ call.healthSnapshot?.alertType || 'Вызов' }}</p>
            <p class="call-time">{{ formatTime(call.createdAt) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Контрактные СМП и стоимость услуг -->
    <SMPCostSummary />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useCallsStore } from '../stores/calls';
import SMPCostSummary from '../components/SMPCostSummary.vue';

const router = useRouter();
const callsStore = useCallsStore();

const { activeCalls, criticalCalls, stats, isLoading } = callsStore;

function formatTime(dateString: string) {
  return format(new Date(dateString), 'HH:mm:ss', { locale: ru });
}

function getTodayResolved(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return callsStore.calls.filter(call => {
    if (call.status !== 'resolved' || !call.resolvedAt) return false;
    const resolvedDate = new Date(call.resolvedAt);
    resolvedDate.setHours(0, 0, 0, 0);
    return resolvedDate.getTime() === today.getTime();
  }).length;
}

function selectCall(call: any) {
  router.push(`/calls/${call.id}`);
}

async function handleAssign(callId: string) {
  try {
    await callsStore.assignCall(callId);
  } catch (error) {
    console.error('Failed to assign call:', error);
  }
}

async function refreshData() {
  await Promise.all([
    callsStore.fetchCalls({ status: undefined }),
    callsStore.fetchStats(),
  ]);
}

onMounted(() => {
  refreshData();
  
  // Auto-refresh every 5 seconds
  const interval = setInterval(() => {
    refreshData();
  }, 5000);

  return () => clearInterval(interval);
});
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.stat-trend {
  margin-top: 0.75rem;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-secondary);
}

.trend-up {
  color: var(--success, #10b981);
}

.trend-critical {
  color: var(--error, #ef4444);
}

.trend-success {
  color: var(--success, #10b981);
}

.trend-value {
  font-size: 0.75rem;
}

.section {
  margin-bottom: 2rem;
}

.section h2 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.calls-list {
  display: grid;
  gap: 1rem;
}

.call-card {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.call-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.call-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.call-body h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.call-body p {
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.call-time {
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.call-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.loading,
.empty {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}
</style>


  margin-bottom: 2rem;
}

.section h2 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.calls-list {
  display: grid;
  gap: 1rem;
}

.call-card {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: var(--                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              