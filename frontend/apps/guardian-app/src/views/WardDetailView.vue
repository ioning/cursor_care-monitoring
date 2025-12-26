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
      <div class="card">
        <h3 class="card-title">Текущие показатели</h3>
        <div v-if="latestTelemetry && latestTelemetry.metrics && Object.keys(latestTelemetry.metrics).length > 0" class="metrics-grid">
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
        <div v-else class="empty-state">
          <p>Нет данных о показателях</p>
          <p class="empty-hint">Данные появятся после подключения устройства или мобильного приложения</p>
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

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Редактировать подопечного</h3>
          <button @click="closeModal" class="modal-close">×</button>
        </div>
        <form @submit.prevent="handleSubmit" class="modal-body">
          <div class="form-group">
            <label class="form-label">Полное имя *</label>
            <input v-model="form.fullName" type="text" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Дата рождения</label>
            <input v-model="form.dateOfBirth" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Пол</label>
            <select v-model="form.gender" class="form-select">
              <option value="">Не указан</option>
              <option value="male">Мужской</option>
              <option value="female">Женский</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Медицинская информация</label>
            <textarea
              v-model="form.medicalInfo"
              class="form-input"
              rows="3"
              placeholder="Аллергии, хронические заболевания и т.д."
            ></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Экстренный контакт</label>
            <input v-model="form.emergencyContact" type="text" class="form-input" />
          </div>
          <div v-if="error" class="error-message">{{ error }}</div>
          <div class="modal-footer">
            <button type="button" @click="closeModal" class="btn btn-secondary">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="wardsStore.isLoading">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, reactive } from 'vue';
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
const showEditModal = ref(false);
const error = ref('');

const form = reactive({
  fullName: '',
  dateOfBirth: '',
  gender: '',
  medicalInfo: '',
  emergencyContact: '',
});

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
    spo2: 'Насыщение кислородом',
    steps: 'Шаги',
    temperature: 'Температура',
    battery: 'Батарея',
    blood_pressure_systolic: 'Давление (верхнее)',
    blood_pressure_diastolic: 'Давление (нижнее)',
    fall_detected: 'Обнаружено падение',
    activity: 'Активность',
    blood_pressure: 'Давление',
  };
  return labels[key] || key;
};

const handleEdit = () => {
  if (!wardsStore.currentWard) return;
  
  // Заполняем форму текущими данными подопечного
  form.fullName = wardsStore.currentWard.fullName || '';
  form.dateOfBirth = wardsStore.currentWard.dateOfBirth || '';
  form.gender = wardsStore.currentWard.gender || '';
  form.medicalInfo = wardsStore.currentWard.medicalInfo || '';
  form.emergencyContact = wardsStore.currentWard.emergencyContact || '';
  
  showEditModal.value = true;
  error.value = '';
};

const handleSubmit = async () => {
  error.value = '';
  try {
    await wardsStore.updateWard(wardId, form);
    closeModal();
    // Обновляем данные подопечного после сохранения
    await wardsStore.fetchWard(wardId);
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Ошибка сохранения данных';
  }
};

const closeModal = () => {
  showEditModal.value = false;
  error.value = '';
  // Очищаем форму
  Object.assign(form, {
    fullName: '',
    dateOfBirth: '',
    gender: '',
    medicalInfo: '',
    emergencyContact: '',
  });
};

const handleAcknowledge = async (alertId: string) => {
  await alertsStore.updateStatus(alertId, { status: 'acknowledged' });
  await alertsStore.fetchAlerts();
};

const loadLatestTelemetry = async () => {
  try {
    const response = await telemetryApi.getLatestTelemetry(wardId);
    if (response && response.data) {
      latestTelemetry.value = response.data;
    } else {
      console.warn('No telemetry data received', response);
      latestTelemetry.value = null;
    }
  } catch (error: any) {
    console.error('Error loading telemetry:', error);
    // Показываем более детальную информацию об ошибке
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    latestTelemetry.value = null;
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
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
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
  color: var(--text-primary);
}

.ward-meta {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.metric-card {
  background: var(--bg-tertiary);
  border-radius: var(--radius);
  padding: 1rem;
  text-align: center;
  border: 1px solid var(--border-color);
}

.metric-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.metric-quality {
  font-size: 0.75rem;
  color: var(--text-tertiary);
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
  background: var(--bg-tertiary);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
}

.device-name {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.device-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--text-tertiary);
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.error-message {
  background-color: rgba(239, 68, 68, 0.2);
  color: var(--danger);
  padding: 0.75rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.3s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  background: var(--bg-card);
}

.form-input[type="date"] {
  font-family: inherit;
}

textarea.form-input {
  resize: vertical;
  min-height: 80px;
}
</style>