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
}

.dashboard-grid {
  display: grid;
  gap: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--shadow);
}

.stat-card.danger {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-top: 0.25rem;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: var(--radius);
  border-left: 4px solid;
  background: var(--gray-50);
}

.alert-item.severity-critical {
  border-left-color: var(--danger);
  background: #fee2e2;
}

.alert-item.severity-high {
  border-left-color: var(--warning);
  background: #fef3c7;
}

.alert-item.severity-medium {
  border-left-color: var(--info);
  background: #dbeafe;
}

.alert-icon {
  font-size: 1.5rem;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 500;
  color: var(--gray-900);
  margin-bottom: 0.25rem;
}

.alert-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--gray-600);
}

.alert-time {
  margin-left: auto;
}

.wards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.ward-card {
  background: var(--gray-50);
  border-radius: var(--radius);
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.ward-card:hover {
  background: var(--gray-100);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.ward-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.25rem;
}

.ward-name {
  font-weight: 500;
  color: var(--gray-900);
}

.ward-meta {
  font-size: 0.75rem;
  color: var(--gray-600);
  margin-top: 0.25rem;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--gray-600);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
</style>

