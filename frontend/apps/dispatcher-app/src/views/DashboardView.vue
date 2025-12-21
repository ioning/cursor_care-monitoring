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
    <!-- <SMPCostSummary /> -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useCallsStore } from '../stores/calls';
// import SMPCostSummary from '../components/SMPCostSummary.vue';

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

let refreshInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  refreshData();
  
  // Auto-refresh every 5 seconds
  refreshInterval = setInterval(() => {
    refreshData();
  }, 5000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeIn 0.5s ease-out;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.dashboard-header h1 {
  font-size: 2rem;
  font-weight: 800;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  background: var(--card-bg);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  text-align: center;
  border: 1px solid var(--border-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-glow-primary);
  border-color: var(--primary-color);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-card.priority-critical {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%);
  border-color: rgba(239, 68, 68, 0.3);
}

.stat-card.priority-critical::before {
  background: var(--gradient-emergency);
}

.stat-value {
  font-size: 3rem;
  font-weight: 800;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 0.75rem;
}

.stat-card.priority-critical .stat-value {
  background: var(--gradient-emergency);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.9375rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-trend {
  margin-top: 1rem;
  font-size: 0.8125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-tertiary);
}

.trend-up {
  color: var(--success-color);
  font-weight: 600;
}

.trend-critical {
  color: var(--danger-color);
  font-weight: 600;
  animation: pulse 2s infinite;
}

.trend-success {
  color: var(--success-color);
  font-weight: 600;
}

.trend-value {
  font-size: 0.8125rem;
}

.section {
  margin-bottom: 3rem;
}

.section h2 {
  margin-bottom: 1.5rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.calls-list {
  display: grid;
  gap: 1.25rem;
}

.call-card {
  background: var(--card-bg);
  padding: 1.75rem;
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
}

.call-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity 0.3s;
}

.call-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-glow-primary);
  border-color: var(--primary-color);
}

.call-card:hover::before {
  opacity: 1;
}

.call-card.priority-critical {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, var(--card-bg) 100%);
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
  animation: pulse-border 2s infinite;
}

@keyframes pulse-border {
  0%, 100% {
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(239, 68, 68, 0.5);
  }
}

.call-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.call-body h3 {
  font-size: 1.375rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.call-body p {
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-size: 0.9375rem;
}

.call-time {
  font-size: 0.8125rem;
  margin-top: 0.75rem;
  color: var(--text-tertiary);
  font-weight: 500;
}

.call-actions {
  margin-top: 1.25rem;
  display: flex;
  gap: 0.75rem;
}

.loading,
.empty {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
  font-size: 1.125rem;
}
</style>
