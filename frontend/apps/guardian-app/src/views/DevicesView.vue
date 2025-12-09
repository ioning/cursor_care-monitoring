<template>
  <div class="devices-view">
    <div class="page-header">
      <h2>Устройства</h2>
      <button @click="showRegisterModal = true" class="btn btn-primary">+ Зарегистрировать устройство</button>
    </div>

    <div v-if="devicesStore.isLoading" class="loading">Загрузка...</div>
    <div v-else-if="devicesStore.devices.length === 0" class="empty-state">
      <p>Нет устройств</p>
      <button @click="showRegisterModal = true" class="btn btn-primary">Зарегистрировать первое устройство</button>
    </div>
    <div v-else class="devices-grid">
      <div v-for="device in devicesStore.devices" :key="device.id" class="device-card">
        <div class="device-header">
          <div class="device-icon">⌚</div>
          <div class="device-info">
            <h3 class="device-name">{{ device.name }}</h3>
            <div class="device-type">{{ getDeviceTypeLabel(device.deviceType) }}</div>
          </div>
          <span class="badge" :class="getStatusBadgeClass(device.status)">
            {{ getStatusLabel(device.status) }}
          </span>
        </div>
        <div class="device-details">
          <div v-if="device.firmwareVersion" class="device-detail">
            <span class="detail-label">Версия прошивки:</span>
            <span>{{ device.firmwareVersion }}</span>
          </div>
          <div v-if="device.macAddress" class="device-detail">
            <span class="detail-label">MAC адрес:</span>
            <span>{{ device.macAddress }}</span>
          </div>
          <div v-if="device.lastSeenAt" class="device-detail">
            <span class="detail-label">Последний раз:</span>
            <span>{{ formatTime(device.lastSeenAt) }}</span>
          </div>
          <div v-if="device.wardId" class="device-detail">
            <span class="detail-label">Привязано к:</span>
            <span>{{ getWardName(device.wardId) }}</span>
          </div>
        </div>
        <div class="device-actions">
          <button
            v-if="!device.wardId"
            @click="showLinkModal(device)"
            class="btn btn-secondary"
          >
            Привязать к подопечному
          </button>
          <button
            v-else
            @click="handleUnlink(device.id)"
            class="btn btn-secondary"
          >
            Отвязать
          </button>
          <button @click="handleDelete(device.id)" class="btn btn-danger">Удалить</button>
        </div>
      </div>
    </div>

    <!-- Register Modal -->
    <div v-if="showRegisterModal" class="modal-overlay" @click="closeRegisterModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Регистрация устройства</h3>
          <button @click="closeRegisterModal" class="modal-close">×</button>
        </div>
        <form @submit.prevent="handleRegister" class="modal-body">
          <div class="form-group">
            <label class="form-label">Название устройства *</label>
            <input v-model="registerForm.name" type="text" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Тип устройства *</label>
            <select v-model="registerForm.deviceType" class="form-select" required>
              <option value="smartwatch">Умные часы</option>
              <option value="bracelet">Браслет</option>
              <option value="pendant">Кулон</option>
              <option value="sensor">Датчик</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Версия прошивки</label>
            <input v-model="registerForm.firmwareVersion" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">MAC адрес</label>
            <input v-model="registerForm.macAddress" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Серийный номер</label>
            <input v-model="registerForm.serialNumber" type="text" class="form-input" />
          </div>
          <div v-if="error" class="error-message">{{ error }}</div>
          <div class="modal-footer">
            <button type="button" @click="closeRegisterModal" class="btn btn-secondary">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="devicesStore.isLoading">
              Зарегистрировать
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Link Modal -->
    <div v-if="showLinkModal && linkingDevice" class="modal-overlay" @click="closeLinkModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Привязать устройство к подопечному</h3>
          <button @click="closeLinkModal" class="modal-close">×</button>
        </div>
        <form @submit.prevent="handleLink" class="modal-body">
          <div class="form-group">
            <label class="form-label">Подопечный *</label>
            <select v-model="linkForm.wardId" class="form-select" required>
              <option value="">Выберите подопечного</option>
              <option v-for="ward in wardsStore.wards" :key="ward.id" :value="ward.id">
                {{ ward.fullName }}
              </option>
            </select>
          </div>
          <div v-if="error" class="error-message">{{ error }}</div>
          <div class="modal-footer">
            <button type="button" @click="closeLinkModal" class="btn btn-secondary">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="devicesStore.isLoading">
              Привязать
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useDevicesStore } from '../stores/devices';
import { useWardsStore } from '../stores/wards';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Device } from '../api/devices.api';

const devicesStore = useDevicesStore();
const wardsStore = useWardsStore();

const showRegisterModal = ref(false);
const showLinkModal = ref(false);
const linkingDevice = ref<Device | null>(null);
const error = ref('');

const registerForm = reactive({
  name: '',
  deviceType: '',
  firmwareVersion: '',
  macAddress: '',
  serialNumber: '',
});

const linkForm = reactive({
  wardId: '',
});

const getDeviceTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    smartwatch: 'Умные часы',
    bracelet: 'Браслет',
    pendant: 'Кулон',
    sensor: 'Датчик',
  };
  return labels[type] || type;
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: 'Активно',
    inactive: 'Неактивно',
    maintenance: 'Обслуживание',
  };
  return labels[status] || status;
};

const getStatusBadgeClass = (status: string) => {
  const classes: Record<string, string> = {
    active: 'badge-success',
    inactive: 'badge-warning',
    maintenance: 'badge-info',
  };
  return classes[status] || '';
};

const formatTime = (date: string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ru });
};

const getWardName = (wardId: string) => {
  const ward = wardsStore.wards.find((w) => w.id === wardId);
  return ward?.fullName || 'Неизвестно';
};

const handleRegister = async () => {
  error.value = '';
  try {
    const device = await devicesStore.registerDevice(registerForm);
    if (device.apiKey) {
      alert(`Устройство зарегистрировано!\nAPI ключ: ${device.apiKey}\nСохраните его в безопасном месте.`);
    }
    closeRegisterModal();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Ошибка регистрации';
  }
};

const showLinkModalForDevice = (device: Device) => {
  linkingDevice.value = device;
  linkForm.wardId = device.wardId || '';
  showLinkModal.value = true;
};

const handleLink = async () => {
  if (!linkingDevice.value) return;
  error.value = '';
  try {
    await devicesStore.linkDevice(linkingDevice.value.id, linkForm);
    closeLinkModal();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Ошибка привязки';
  }
};

const handleUnlink = async (deviceId: string) => {
  if (!confirm('Отвязать устройство от подопечного?')) return;
  try {
    await devicesStore.updateDevice(deviceId, { status: 'inactive' });
    await devicesStore.fetchDevices();
  } catch (err: any) {
    alert('Ошибка отвязки устройства');
  }
};

const handleDelete = async (deviceId: string) => {
  if (!confirm('Удалить устройство?')) return;
  try {
    await devicesStore.deleteDevice(deviceId);
  } catch (err: any) {
    alert('Ошибка удаления устройства');
  }
};

const closeRegisterModal = () => {
  showRegisterModal.value = false;
  Object.assign(registerForm, {
    name: '',
    deviceType: '',
    firmwareVersion: '',
    macAddress: '',
    serialNumber: '',
  });
  error.value = '';
};

const closeLinkModal = () => {
  showLinkModal.value = false;
  linkingDevice.value = null;
  linkForm.wardId = '';
  error.value = '';
};

onMounted(async () => {
  await Promise.all([
    devicesStore.fetchDevices(),
    wardsStore.fetchWards(),
  ]);
});
</script>

<style scoped>
.devices-view {
  max-width: 1400px;
  margin: 0 auto;
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.device-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow);
}

.device-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.device-icon {
  font-size: 2rem;
}

.device-info {
  flex: 1;
}

.device-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 0.25rem;
}

.device-type {
  font-size: 0.875rem;
  color: var(--gray-600);
}

.device-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--gray-50);
  border-radius: var(--radius);
}

.device-detail {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.detail-label {
  color: var(--gray-600);
}

.device-actions {
  display: flex;
  gap: 0.5rem;
}
</style>

