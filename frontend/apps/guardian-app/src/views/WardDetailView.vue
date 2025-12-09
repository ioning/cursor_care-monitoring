<template>
  <div class="ward-detail-view">
    <div v-if="wardsStore.isLoading" class="loading">Загрузка...</div>
    <div v-else-if="!wardsStore.currentWard" class="empty-state">Подопечный не найден</div>
    <div v-else>
      <!-- Ward Header -->
      <div class="ward-header">
        <div class="ward-header-info">
          <div class="ward-avatar-large">{{ wardsStore.currentWard.fullName.charAt(0) }}</div>
          <div>
            <h2>{{ wardsStore.currentWard.fullName }}</h2>
            <div class="ward-meta">
              <span v-if="wardsStore.currentWard.dateOfBirth">
                {{ calculateAge(wardsStore.currentWard.dateOfBirth) }} лет
              </span>
              <span v-if="wardsStore.currentWard.gender">
                • {{ wardsStore.currentWard.gender === 'male' ? 'Мужской' : 'Женский' }}
              </span>
            </div>
          </div>
        </div>
        <button @click="handleEdit" class="btn btn-primary">Редактировать</button>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Последнее обновление</div>
          <div class="stat-value">
            {{ latestTelemetry ? formatTime(latestTelemetry.timestamp) : 'Нет данных' }}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Активных алертов</div>
          <div class="stat-value">{{ wardAlerts.length }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Устройств</div>
          <div class="stat-value">{{ wardDevices.length }}</div>
        </div>
      </div>

      <!-- Current Metrics -->
      <div v-if="latestTelemetry" class="card">
        <h3 class="card-title">Текущие показатели</h3>
        <div class="metrics-grid">
          <div
            v-for="(metric, key) in latestTelemetry.metrics"
            :key="key"
            class="metric-card"
          >
            <div class="metric-label">{{ getMetricLabel(key) }}</div>
            <div class="metric-value">
              {{ metric.value }} {{ metric.unit || '' }}
            </div>
            <div v-if="metric.qualityScore" class="metric-quality">
              Качество: {{ (metric.qualityScore * 100).toFixed(0) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Location Map -->
      <div class="card">
        <WardLocationMap :wardId="wardId" :wardName="wardsStore.currentWard.fullName" />
      </div>

      <!-- Charts -->
      <div class="card">
        <h3 class="card-title">График показателей</h3>
        <div class="chart-container">
          <TelemetryChart :wardId="wardId" />
        </div>
      </div>

      <!-- Alerts -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Алерты</h3>
          <RouterLink to="/alerts" class="link">Все алерты →</RouterLink>
        </div>
        <div v-if="wardAlerts.length === 0" class="empty-state">Нет алертов</div>
        <div v-else class="alerts-list">
          <div
            v-for="alert in wardAlerts"
            :key="alert.id"
            class="alert-item"
            :class="`severity-${alert.severity}`"
          >
            <div class="alert-content">
              <div class="alert-title">{{ alert.title }}</div>
              <div class="alert-meta">
                <span class="badge" :class="`badge-${alert.severity}`">
                  {{ alert.severity }}
                </span>
                <span class="alert-time">{{ formatTime(alert.createdAt) }}</span>
              </div>
            </div>
            <button
              @click="handleAcknowledge(alert.id)"
              v-if="alert.status === 'active'"
              class="btn btn-secondary btn-sm"
            >
              Отметить
            </button>
          </div>
        </div>
      </div>

      <!-- Devices -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Устройства</h3>
          <RouterLink to="/devices" class="link">Все устройства →</RouterLink>
        </div>
        <div v-if="wardDevices.length === 0" class="empty-state">Нет устройств</div>
        <div v-else class="devices-list">
          <div v-for="device in wardDevices" :key="device.id" class="device-item">
            <div class="device-info">
              <div class="device-name">{{ device.name }}</div>
              <div class="device-meta">
                <span class="badge" :class="`badge-${device.status === 'active' ? 'success' : 'warning'}`">
                  {{ device.status }}
                </span>
                <span v-if="device.lastSeenAt" class="device-time">
                  Последний раз: {{ formatTime(device.lastSeenAt) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useWardsStore } from '../stores/wards';
import { useAlertsStore } from '../stores/alerts';
import { useDevicesStore } from '../stores/devices';
import { telemetryApi } from '../api/telemetry.api';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import TelemetryChart from '../components/TelemetryChart.vue';
import WardLocationMap from '../components/WardLocationMap.vue';

const route = useRoute();
const wardId = route.params.id as string;

const wardsStore = useWardsStore();
const alertsStore = useAlertsStore();
const devicesStore = useDevicesStore();

const latestTelemetry = ref<any>(null);

const wardAlerts = computed(() =>
  alertsStore.alerts.filter((a) => a.wardId === wardId && a.status === 'active'),
);

const wardDevices = computed(() =>
  devicesStore.devices.filter((d) => d.wardId === wardId),
);

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

const formatTime = (date: string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ru });
};

const getMetricLabel = (key: string) => {
  const labels: Record<string, string> = {
    heart_rate: 'Пульс',
    activity: 'Активность',
    temperature: 'Температура',
    blood_pressure: 'Давление',
  };
  return labels[key] || key;
};

const handleEdit = () => {
  // Navigate to edit or open modal
};

const handleAcknowledge = async (alertId: string) => {
  await alertsStore.updateStatus(alertId, { status: 'acknowledged' });
  await alertsStore.fetchAlerts();
};

const loadLatestTelemetry = async () => {
  try {
    const response = await telemetryApi.getLatestTelemetry(wardId);
    latestTelemetry.value = response.data;
  } catch (error) {
    console.error('Error loading telemetry:', error);
  }
};

onMounted(async () => {
  await Promise.all([
    wardsStore.fetchWard(wardId),
    alertsStore.fetchAlerts({ wardId }),
    devicesStore.fetchDevices(),
    loadLatestTelemetry(),
  ]);
});
</script>

<style scoped>
.ward-detail-view {
  max-width: 1400px;
  margin: 0 auto;
}

.ward-header {
  background: white;
  border-radius: var(--radius-lg);
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow);
}

.ward-header-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.ward-header h2 {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.ward-meta {
  color: var(--gray-600);
  font-size: 0.875rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray-900);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.metric-card {
  background: var(--gray-50);
  border-radius: var(--radius);
  padding: 1rem;
  text-align: center;
}

.metric-label {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray-900);
}

.metric-quality {
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-top: 0.25rem;
}

.chart-container {
  height: 400px;
  margin-top: 1rem;
}

.devices-list,
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.device-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--gray-50);
  border-radius: var(--radius);
}

.device-name {
  font-weight: 500;
  color: var(--gray-900);
  margin-bottom: 0.25rem;
}

.device-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--gray-600);
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}
</style>


  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}
</style>


  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}
</style>

