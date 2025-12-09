<template>
  <div class="alerts-view">
    <div class="page-header">
      <h2>Алерты</h2>
      <div class="filters">
        <select v-model="filters.wardId" @change="applyFilters" class="form-select">
          <option value="">Все подопечные</option>
          <option v-for="ward in wardsStore.wards" :key="ward.id" :value="ward.id">
            {{ ward.fullName }}
          </option>
        </select>
        <select v-model="filters.status" @change="applyFilters" class="form-select">
          <option value="">Все статусы</option>
          <option value="active">Активные</option>
          <option value="acknowledged">Отмеченные</option>
          <option value="resolved">Решенные</option>
        </select>
        <select v-model="filters.severity" @change="applyFilters" class="form-select">
          <option value="">Все уровни</option>
          <option value="critical">Критические</option>
          <option value="high">Высокие</option>
          <option value="medium">Средние</option>
          <option value="low">Низкие</option>
        </select>
      </div>
    </div>

    <div v-if="alertsStore.isLoading" class="loading">Загрузка...</div>
    <div v-else-if="alertsStore.alerts.length === 0" class="empty-state">
      Нет алертов
    </div>
    <div v-else class="alerts-list">
      <div
        v-for="alert in alertsStore.alerts"
        :key="alert.id"
        class="alert-card"
        :class="`severity-${alert.severity}`"
        @click="selectAlert(alert)"
      >
        <div class="alert-icon">
          <span v-if="alert.severity === 'critical'">🚨</span>
          <span v-else-if="alert.severity === 'high'">⚠️</span>
          <span v-else-if="alert.severity === 'medium'">ℹ️</span>
          <span v-else>📌</span>
        </div>
        <div class="alert-content">
          <div class="alert-header">
            <h3 class="alert-title">{{ alert.title }}</h3>
            <span class="badge" :class="`badge-${alert.severity}`">
              {{ getSeverityLabel(alert.severity) }}
            </span>
          </div>
          <p v-if="alert.description" class="alert-description">{{ alert.description }}</p>
          <div class="alert-meta">
            <span class="alert-ward">{{ getWardName(alert.wardId) }}</span>
            <span class="alert-time">{{ formatTime(alert.createdAt) }}</span>
            <span v-if="alert.aiConfidence" class="alert-confidence">
              Уверенность AI: {{ (alert.aiConfidence * 100).toFixed(0) }}%
            </span>
          </div>
        </div>
        <div class="alert-actions">
          <button
            v-if="alert.status === 'active'"
            @click.stop="handleAcknowledge(alert.id)"
            class="btn btn-secondary btn-sm"
          >
            Отметить
          </button>
          <button
            v-if="alert.status === 'active'"
            @click.stop="handleResolve(alert.id)"
            class="btn btn-primary btn-sm"
          >
            Решить
          </button>
        </div>
      </div>
    </div>

    <!-- Alert Detail Modal -->
    <div v-if="selectedAlert" class="modal-overlay" @click="selectedAlert = null">
      <div class="modal-content modal-large" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedAlert.title }}</h3>
          <button @click="selectedAlert = null" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="alert-detail-info">
            <div class="detail-row">
              <span class="detail-label">Статус:</span>
              <span class="badge" :class="`badge-${selectedAlert.status === 'active' ? 'danger' : 'success'}`">
                {{ getStatusLabel(selectedAlert.status) }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Уровень:</span>
              <span class="badge" :class="`badge-${selectedAlert.severity}`">
                {{ getSeverityLabel(selectedAlert.severity) }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Подопечный:</span>
              <span>{{ getWardName(selectedAlert.wardId) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Создан:</span>
              <span>{{ formatTime(selectedAlert.createdAt) }}</span>
            </div>
            <div v-if="selectedAlert.aiConfidence" class="detail-row">
              <span class="detail-label">Уверенность AI:</span>
              <span>{{ (selectedAlert.aiConfidence * 100).toFixed(0) }}%</span>
            </div>
            <div v-if="selectedAlert.description" class="detail-row full-width">
              <span class="detail-label">Описание:</span>
              <p>{{ selectedAlert.description }}</p>
            </div>
          </div>
          <div v-if="selectedAlert.status === 'active'" class="modal-footer">
            <button @click="handleAcknowledge(selectedAlert.id)" class="btn btn-secondary">
              Отметить как прочитанное
            </button>
            <button @click="handleResolve(selectedAlert.id)" class="btn btn-primary">
              Решить
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useAlertsStore } from '../stores/alerts';
import { useWardsStore } from '../stores/wards';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Alert } from '../api/alerts.api';

const alertsStore = useAlertsStore();
const wardsStore = useWardsStore();

const selectedAlert = ref<Alert | null>(null);

const filters = reactive({
  wardId: '',
  status: '',
  severity: '',
});

const getSeverityLabel = (severity: string) => {
  const labels: Record<string, string> = {
    critical: 'Критический',
    high: 'Высокий',
    medium: 'Средний',
    low: 'Низкий',
  };
  return labels[severity] || severity;
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: 'Активный',
    acknowledged: 'Отмечен',
    resolved: 'Решен',
    false_positive: 'Ложное срабатывание',
  };
  return labels[status] || status;
};

const getWardName = (wardId: string) => {
  const ward = wardsStore.wards.find((w) => w.id === wardId);
  return ward?.fullName || 'Неизвестно';
};

const formatTime = (date: string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ru });
};

const applyFilters = () => {
  alertsStore.fetchAlerts(filters);
};

const selectAlert = (alert: Alert) => {
  selectedAlert.value = alert;
};

const handleAcknowledge = async (alertId: string) => {
  await alertsStore.updateStatus(alertId, { status: 'acknowledged' });
  await alertsStore.fetchAlerts(filters);
  if (selectedAlert.value?.id === alertId) {
    selectedAlert.value.status = 'acknowledged';
  }
};

const handleResolve = async (alertId: string) => {
  await alertsStore.updateStatus(alertId, { status: 'resolved' });
  await alertsStore.fetchAlerts(filters);
  if (selectedAlert.value?.id === alertId) {
    selectedAlert.value.status = 'resolved';
  }
};

onMounted(async () => {
  await Promise.all([
    alertsStore.fetchAlerts(),
    wardsStore.fetchWards(),
  ]);
});
</script>

<style scoped>
.alerts-view {
  max-width: 1400px;
  margin: 0 auto;
}

.filters {
  display: flex;
  gap: 0.75rem;
}

.filters .form-select {
  min-width: 150px;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alert-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow);
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 4px solid;
}

.alert-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateX(4px);
}

.alert-card.severity-critical {
  border-left-color: var(--danger);
  background: #fee2e2;
}

.alert-card.severity-high {
  border-left-color: var(--warning);
  background: #fef3c7;
}

.alert-card.severity-medium {
  border-left-color: var(--info);
  background: #dbeafe;
}

.alert-card.severity-low {
  border-left-color: var(--gray-400);
}

.alert-icon {
  font-size: 2rem;
}

.alert-content {
  flex: 1;
}

.alert-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.alert-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
}

.alert-description {
  color: var(--gray-700);
  margin-bottom: 0.75rem;
}

.alert-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--gray-600);
}

.alert-actions {
  display: flex;
  gap: 0.5rem;
}

.modal-large {
  max-width: 600px;
}

.alert-detail-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.detail-row.full-width {
  flex-direction: column;
  align-items: flex-start;
}

.detail-label {
  font-weight: 500;
  color: var(--gray-700);
  min-width: 120px;
}
</style>

