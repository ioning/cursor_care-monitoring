<template>
  <section class="services-health glass-panel">
    <header>
      <div>
        <h3>Статус сервисов</h3>
        <p>Работоспособность всех компонентов системы</p>
      </div>
      <div class="header-actions">
        <button class="ghost" @click="refresh" :disabled="loading">
          {{ loading ? 'Обновление...' : 'Обновить' }}
        </button>
        <button class="danger" @click="confirmRestartAll" :disabled="loading">
          Перезапустить все
        </button>
      </div>
    </header>

    <div v-if="loading && !services.length" class="loading">Загрузка статусов...</div>
    <div v-else class="services-grid">
      <div
        v-for="service in services"
        :key="service.name"
        class="service-card"
        :class="{ [service.status]: true }"
      >
        <div class="service-header">
          <div class="service-status">
            <span class="status-indicator" :class="service.status"></span>
            <h4>{{ service.name }}</h4>
          </div>
          <button
            class="restart-btn"
            @click="confirmRestart(service.name)"
            :disabled="loading"
            title="Перезапустить сервис"
          >
            🔄
          </button>
        </div>

        <div class="service-info">
          <div v-if="service.latency !== undefined" class="info-item">
            <span class="label">Задержка:</span>
            <span class="value">{{ service.latency }}ms</span>
          </div>

          <div v-if="service.checks" class="checks">
            <span
              v-if="service.checks.database"
              class="check-badge"
              :class="{ up: service.checks.database === 'up', down: service.checks.database === 'down' }"
            >
              DB: {{ service.checks.database === 'up' ? '✓' : '✗' }}
            </span>
            <span
              v-if="service.checks.redis"
              class="check-badge"
              :class="{ up: service.checks.redis === 'up', down: service.checks.redis === 'down' }"
            >
              Redis: {{ service.checks.redis === 'up' ? '✓' : '✗' }}
            </span>
            <span
              v-if="service.checks.rabbitmq"
              class="check-badge"
              :class="{ up: service.checks.rabbitmq === 'up', down: service.checks.rabbitmq === 'down' }"
            >
              MQ: {{ service.checks.rabbitmq === 'up' ? '✓' : '✗' }}
            </span>
          </div>

          <div v-if="service.error" class="error-message">
            {{ service.error }}
          </div>

          <div v-if="service.timestamp" class="timestamp">
            Обновлено: {{ formatTime(service.timestamp) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation dialog -->
    <div v-if="showRestartDialog" class="modal-overlay" @click.self="showRestartDialog = false">
      <div class="modal glass-panel">
        <h3>Подтверждение перезапуска</h3>
        <p>
          Вы уверены, что хотите перезапустить
          <strong>{{ restartTarget === 'all' ? 'все сервисы' : restartTarget }}</strong>?
        </p>
        <div class="modal-actions">
          <button class="ghost" @click="showRestartDialog = false">Отмена</button>
          <button class="danger" @click="handleRestart" :disabled="restarting">
            {{ restarting ? 'Перезапуск...' : 'Подтвердить' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRealtimeChannel } from '@/composables/useRealtimeChannel';
import { fetchServicesHealth, restartService, restartAllServices, type ServiceHealth } from '@/api/services.api';

const services = ref<ServiceHealth[]>([]);
const loading = ref(false);
const showRestartDialog = ref(false);
const restartTarget = ref<string | 'all'>('all');
const restarting = ref(false);

const refresh = async () => {
  loading.value = true;
  try {
    const response = await fetchServicesHealth();
    services.value = response.services;
  } catch (error) {
    console.error('Failed to fetch services health:', error);
  } finally {
    loading.value = false;
  }
};

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString('ru-RU');
};

const confirmRestart = (serviceName: string) => {
  restartTarget.value = serviceName;
  showRestartDialog.value = true;
};

const confirmRestartAll = () => {
  restartTarget.value = 'all';
  showRestartDialog.value = true;
};

const handleRestart = async () => {
  restarting.value = true;
  try {
    if (restartTarget.value === 'all') {
      await restartAllServices();
    } else {
      await restartService(restartTarget.value);
    }
    showRestartDialog.value = false;
    // Обновляем статусы после перезапуска
    setTimeout(() => {
      refresh();
    }, 2000);
  } catch (error) {
    console.error('Failed to restart service:', error);
    alert('Ошибка при перезапуске сервиса');
  } finally {
    restarting.value = false;
  }
};

// Подключаем realtime обновления
useRealtimeChannel('admin.services.health', () => {
  refresh();
});

// Автообновление каждые 30 секунд
let refreshInterval: NodeJS.Timeout | null = null;

onMounted(() => {
  refresh();
  refreshInterval = setInterval(refresh, 30000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.services-health {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

header h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
}

header p {
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.ghost,
.danger {
  border: 0;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
}

.ghost {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
}

.danger {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.3);
}

.ghost:disabled,
.danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.6);
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.service-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.2s;
}

.service-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.service-card.healthy {
  border-left: 3px solid #4ade80;
}

.service-card.unhealthy {
  border-left: 3px solid #ef4444;
}

.service-card.unknown {
  border-left: 3px solid #fbbf24;
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.service-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-indicator.healthy {
  background: #4ade80;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.5);
}

.status-indicator.unhealthy {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
}

.status-indicator.unknown {
  background: #fbbf24;
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.5);
}

.service-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.restart-btn {
  background: transparent;
  border: 0;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  font-size: 1.125rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.restart-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  transform: rotate(180deg);
}

.restart-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.service-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
}

.label {
  color: rgba(255, 255, 255, 0.6);
}

.value {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

.checks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.check-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.check-badge.up {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.check-badge.down {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.error-message {
  color: #fca5a5;
  font-size: 0.75rem;
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.timestamp {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.75rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal {
  padding: 2rem;
  border-radius: 12px;
  max-width: 400px;
  width: 100%;
}

.modal h3 {
  margin: 0 0 1rem 0;
}

.modal p {
  margin: 0 0 1.5rem 0;
  color: rgba(255, 255, 255, 0.7);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>

