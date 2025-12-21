<template>
  <div class="dashboard-view">
    <div class="dashboard-grid">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-value">{{ wardsStore.wards.length }}</div>
            <div class="stat-label">Подопечных</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⌚</div>
          <div class="stat-content">
            <div class="stat-value">{{ devicesStore.devices.length }}</div>
            <div class="stat-label">Устройств</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔔</div>
          <div class="stat-content">
            <div class="stat-value">{{ alertsStore.activeAlerts.length }}</div>
            <div class="stat-label">Активных алертов</div>
          </div>
        </div>
        <div class="stat-card danger">
          <div class="stat-icon">⚠️</div>
          <div class="stat-content">
            <div class="stat-value">{{ alertsStore.criticalAlerts.length }}</div>
            <div class="stat-label">Критических</div>
          </div>
        </div>
      </div>

      <!-- Recent Alerts -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Последние алерты</h3>
          <RouterLink to="/alerts" class="link">Все алерты →</RouterLink>
        </div>
        <div v-if="alertsStore.isLoading" class="loading">Загрузка...</div>
        <div v-else-if="recentAlerts.length === 0" class="empty-state">
          Нет алертов
        </div>
        <div v-else class="alerts-list">
          <div
            v-for="alert in recentAlerts"
            :key="alert.id"
            class="alert-item"
            :class="`severity-${alert.severity}`"
          >
            <div class="alert-icon">
              <span v-if="alert.severity === 'critical'">🚨</span>
              <span v-else-if="alert.severity === 'high'">⚠️</span>
              <span v-else>ℹ️</span>
            </div>
            <div class="alert-content">
              <div class="alert-title">{{ alert.title }}</div>
              <div class="alert-meta">
                <span class="badge" :class="`badge-${alert.severity}`">
                  {{ alert.severity }}
                </span>
                <span class="alert-time">{{ formatTime(alert.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wards Overview -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Подопечные</h3>
          <RouterLink to="/wards" class="link">Все подопечные →</RouterLink>
        </div>
        <div v-if="wardsStore.isLoading" class="loading">Загрузка...</div>
        <div v-else-if="wardsStore.wards.length === 0" class="empty-state">
          <p>Нет подопечных</p>
          <RouterLink to="/wards" class="btn btn-primary">Добавить подопечного</RouterLink>
        </div>
        <div v-else class="wards-grid">
          <div
            v-for="ward in wardsStore.wards.slice(0, 4)"
            :key="ward.id"
            class="ward-card"
            @click="$router.push(`/wards/${ward.id}`)"
          >
            <div class="ward-avatar">{{ ward.fullName.charAt(0) }}</div>
            <div class="ward-info">
              <div class="ward-name">{{ ward.fullName }}</div>
              <div class="ward-meta">
                <span v-if="ward.dateOfBirth">{{ calculateAge(ward.dateOfBirth) }} лет</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useRealtimeChannel } from '@/composables/useRealtimeChannel';
import { useWardsStore } from '../stores/wards';
import { useDevicesStore } from '../stores/devices';
import { useAlertsStore } from '../stores/alerts';

const wardsStore = useWardsStore();
const devicesStore = useDevicesStore();
const alertsStore = useAlertsStore();

const recentAlerts = computed(() =>
  alertsStore.alerts
    .filter((a) => a.status === 'active')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5),
);

const formatTime = (date: string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ru });
};

const calculateAge = (dateOfBirth: string) => {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

onMounted(async () => {
  await Promise.all([
    wardsStore.fetchWards(),
    devicesStore.fetchDevices(),
    alertsStore.fetchAlerts(),
  ]);
});

useRealtimeChannel('alerts.created', (payload) => {
  alertsStore.ingestRealtimeAlert(payload);
});
</script>

<style scoped>
.dashboard-view {
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeIn 0.5s ease-out;
}

.dashboard-grid {
  display: grid;
  gap: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: var(--shadow-lg);
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
  box-shadow: var(--shadow-glow);
  border-color: var(--primary);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-card.danger {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%);
  border-color: rgba(239, 68, 68, 0.3);
}

.stat-card.danger::before {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.stat-icon {
  font-size: 3rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 800;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-card.danger .stat-value {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.25rem;
  border-radius: var(--radius);
  border-left: 4px solid;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-left-width: 4px;
  transition: all 0.3s;
}

.alert-item:hover {
  transform: translateX(4px);
  box-shadow: var(--shadow-md);
}

.alert-item.severity-critical {
  border-left-color: var(--danger);
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, var(--bg-tertiary) 100%);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
}

.alert-item.severity-high {
  border-left-color: var(--warning);
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, var(--bg-tertiary) 100%);
}

.alert-item.severity-medium {
  border-left-color: var(--info);
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, var(--bg-tertiary) 100%);
}

.alert-icon {
  font-size: 1.75rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.alert-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8125rem;
  color: var(--text-tertiary);
}

.alert-time {
  margin-left: auto;
  color: var(--text-muted);
}

.wards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
}

.ward-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
}

.ward-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
  transition: left 0.5s;
}

.ward-card:hover::before {
  left: 100%;
}

.ward-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-glow);
  border-color: var(--primary);
}

.ward-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--gradient-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.5rem;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.ward-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.ward-meta {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
}

.loading,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.empty-state p {
  font-size: 1.125rem;
  color: var(--text-tertiary);
}
</style>

