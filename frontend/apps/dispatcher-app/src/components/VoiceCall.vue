<template>
  <div class="voice-call" v-if="isCallActive">
    <div class="call-controls">
      <div class="call-info">
        <h3>Голосовой вызов</h3>
        <p v-if="callState.isMuted" class="muted-indicator">🔇 Микрофон выключен</p>
        <p v-else class="muted-indicator">🎤 Микрофон включен</p>
      </div>

      <div class="controls-row">
        <!-- Управление микрофоном -->
        <button
          @click="toggleMute"
          :class="['btn', 'btn-icon', callState.isMuted ? 'btn-muted' : 'btn-active']"
          :title="callState.isMuted ? 'Включить микрофон' : 'Выключить микрофон'"
        >
          {{ callState.isMuted ? '🎤' : '🔇' }}
        </button>

        <!-- Завершить вызов -->
        <button
          @click="endCall"
          class="btn btn-icon btn-danger"
          title="Завершить вызов"
        >
          📞
        </button>
      </div>

      <!-- Выбор устройств -->
      <div class="device-selectors">
        <div class="device-selector">
          <label>Микрофон:</label>
          <select
            v-model="selectedInputDevice"
            @change="onInputDeviceChange"
            class="device-select"
          >
            <option value="">По умолчанию</option>
            <option
              v-for="device in audioDevices.inputs"
              :key="device.deviceId"
              :value="device.deviceId"
            >
              {{ device.label }}
            </option>
          </select>
        </div>

        <div class="device-selector">
          <label>Динамики:</label>
          <select
            v-model="selectedOutputDevice"
            @change="onOutputDeviceChange"
            class="device-select"
          >
            <option value="">По умолчанию</option>
            <option
              v-for="device in audioDevices.outputs"
              :key="device.deviceId"
              :value="device.deviceId"
            >
              {{ device.label }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { voiceCallService, type AudioDevice } from '../services/voiceCall.service';

interface Props {
  callId: string;
  wardId: string;
  dispatcherId: string;
  wardPhone?: string;
}

const props = defineProps<Props>();

const isCallActive = ref(false);
const audioDevices = ref<{ inputs: AudioDevice[]; outputs: AudioDevice[] }>({
  inputs: [],
  outputs: [],
});
const selectedInputDevice = ref<string>('');
const selectedOutputDevice = ref<string>('');
const callState = ref({
  isActive: false,
  isMuted: false,
  inputDevice: null as string | null,
  outputDevice: null as string | null,
});

let stateUpdateInterval: number | null = null;

onMounted(async () => {
  try {
    // Загружаем список устройств
    await loadAudioDevices();

    // Инициализируем вызов
    await voiceCallService.initializeCall({
      callId: props.callId,
      wardId: props.wardId,
      dispatcherId: props.dispatcherId,
      wardPhone: props.wardPhone,
    });

    isCallActive.value = true;

    // Обновляем состояние каждую секунду
    stateUpdateInterval = window.setInterval(() => {
      callState.value = voiceCallService.getCallState();
    }, 1000);
  } catch (error) {
    console.error('Failed to initialize voice call:', error);
    alert('Не удалось инициализировать голосовой вызов');
  }
});

onUnmounted(() => {
  if (stateUpdateInterval) {
    clearInterval(stateUpdateInterval);
  }
  if (isCallActive.value) {
    voiceCallService.endCall();
  }
});

async function loadAudioDevices() {
  try {
    const devices = await voiceCallService.getAudioDevices();
    audioDevices.value = devices;
  } catch (error) {
    console.error('Failed to load audio devices:', error);
  }
}

async function onInputDeviceChange() {
  if (selectedInputDevice.value) {
    try {
      await voiceCallService.setInputDevice(selectedInputDevice.value);
    } catch (error) {
      console.error('Failed to set input device:', error);
      alert('Не удалось переключить микрофон');
    }
  }
}

async function onOutputDeviceChange() {
  if (selectedOutputDevice.value) {
    try {
      await voiceCallService.setOutputDevice(selectedOutputDevice.value);
    } catch (error) {
      console.error('Failed to set output device:', error);
      alert('Не удалось переключить динамики');
    }
  }
}

function toggleMute() {
  voiceCallService.toggleMute();
  callState.value = voiceCallService.getCallState();
}

async function endCall() {
  try {
    await voiceCallService.endCall();
    isCallActive.value = false;
    emit('call-ended');
  } catch (error) {
    console.error('Failed to end call:', error);
  }
}

const emit = defineEmits<{
  'call-ended': [];
}>();
</script>

<style scoped>
.voice-call {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 1.5rem;
  min-width: 300px;
  z-index: 1000;
}

.call-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.call-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.muted-indicator {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.controls-row {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.btn-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-active {
  background: var(--primary-color);
  color: white;
}

.btn-muted {
  background: #dc3545;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.device-selectors {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.device-selector {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.device-selector label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.device-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}

.device-select:hover {
  border-color: var(--primary-color);
}

.device-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>

