<template>
  <div class="call-detail">
    <div v-if="isLoading" class="loading">Загрузка...</div>
    <div v-else-if="!selectedCall" class="empty">Вызов не найден</div>
    <div v-else class="detail-content">
      <!-- Заголовок -->
      <div class="detail-header">
        <div>
          <h1>Вызов #{{ selectedCall.id.slice(0, 8) }}</h1>
          <div class="call-meta">
            <span class="badge" :class="`badge-${selectedCall.priority}`">
              {{ selectedCall.priority }}
            </span>
            <span :class="`status-${selectedCall.status}`">
              {{ getStatusLabel(selectedCall.status) }}
            </span>
            <span class="call-time">{{ formatTime(selectedCall.createdAt) }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button
            v-if="selectedCall.status === 'created'"
            @click="handleAssign"
            class="btn btn-primary"
          >
            Принять вызов
          </button>
          <button
            v-if="selectedCall.status === 'assigned' || selectedCall.status === 'in_progress'"
            @click="handleStart"
            class="btn btn-warning"
          >
            Начать работу
          </button>
          <button
            v-if="selectedCall.status === 'in_progress' && !isVoiceCallActive"
            @click="startVoiceCall"
            class="btn btn-primary"
          >
            📞 Начать звонок
          </button>
          <button
            v-if="selectedCall.status === 'in_progress'"
            @click="showResolveDialog = true"
            class="btn btn-success"
          >
            Завершить вызов
          </button>
        </div>
      </div>

      <div class="detail-grid">
        <!-- Информация о подопечном -->
        <div class="detail-section">
          <h2>Информация о подопечном</h2>
          <div class="info-card">
            <div class="info-item">
              <span class="info-label">Имя:</span>
              <span class="info-value">{{ selectedCall.ward?.fullName || 'Неизвестно' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">ID:</span>
              <span class="info-value">{{ selectedCall.wardId }}</span>
            </div>
            <div v-if="selectedCall.ward?.emergencyContact" class="info-item">
              <span class="info-label">Контакты:</span>
              <span class="info-value">{{ selectedCall.ward.emergencyContact }}</span>
            </div>
          </div>
        </div>

        <!-- Медицинская информация -->
        <div class="detail-section" v-if="selectedCall.healthSnapshot">
          <h2>Медицинские данные</h2>
          <div class="info-card">
            <div v-if="selectedCall.healthSnapshot.alertType" class="info-item">
              <span class="info-label">Тип алерта:</span>
              <span class="info-value">{{ selectedCall.healthSnapshot.alertType }}</span>
            </div>
            <div v-if="selectedCall.healthSnapshot.riskScore" class="info-item">
              <span class="info-label">Оценка риска:</span>
              <span class="info-value">{{ selectedCall.healthSnapshot.riskScore }}</span>
            </div>
            <div v-if="selectedCall.healthSnapshot.confidence" class="info-item">
              <span class="info-label">Уверенность:</span>
              <span class="info-value">{{ (selectedCall.healthSnapshot.confidence * 100).toFixed(1) }}%</span>
            </div>
          </div>
        </div>

        <!-- AI анализ -->
        <div class="detail-section" v-if="selectedCall.aiAnalysis">
          <h2>AI анализ</h2>
          <div class="info-card">
            <div v-if="selectedCall.aiAnalysis.modelId" class="info-item">
              <span class="info-label">Модель:</span>
              <span class="info-value">{{ selectedCall.aiAnalysis.modelId }}</span>
            </div>
            <div v-if="selectedCall.aiAnalysis.modelVersion" class="info-item">
              <span class="info-label">Версия:</span>
              <span class="info-value">{{ selectedCall.aiAnalysis.modelVersion }}</span>
            </div>
          </div>
        </div>

        <!-- История -->
        <div class="detail-section">
          <h2>История</h2>
          <div class="info-card">
            <div class="info-item">
              <span class="info-label">Создан:</span>
              <span class="info-value">{{ formatTime(selectedCall.createdAt) }}</span>
            </div>
            <div v-if="selectedCall.assignedAt" class="info-item">
              <span class="info-label">Назначен:</span>
              <span class="info-value">{{ formatTime(selectedCall.assignedAt) }}</span>
            </div>
            <div v-if="selectedCall.resolvedAt" class="info-item">
              <span class="info-label">Завершен:</span>
              <span class="info-value">{{ formatTime(selectedCall.resolvedAt) }}</span>
            </div>
            <div v-if="selectedCall.source" class="info-item">
              <span class="info-label">Источник:</span>
              <span class="info-value">{{ selectedCall.source }}</span>
            </div>
          </div>
        </div>

        <!-- Заметки -->
        <div class="detail-section full-width">
          <h2>Заметки</h2>
          <div class="info-card">
            <textarea
              v-model="notes"
              placeholder="Добавить заметку..."
              rows="4"
              class="notes-input"
            ></textarea>
            <button @click="saveNotes" class="btn btn-primary">Сохранить заметки</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Диалог завершения -->
    <div v-if="showResolveDialog" class="dialog-overlay" @click="showResolveDialog = false">
      <div class="dialog" @click.stop>
        <h3>Завершить вызов</h3>
        <textarea
          v-model="resolveNotes"
          placeholder="Примечания к завершению..."
          rows="4"
          class="notes-input"
        ></textarea>
        <div class="dialog-actions">
          <button @click="showResolveDialog = false" class="btn btn-secondary">Отмена</button>
          <button @click="handleResolve" class="btn btn-success">Завершить</button>
        </div>
      </div>
    </div>

    <!-- Голосовой вызов -->
    <VoiceCall
      v-if="isVoiceCallActive && selectedCall"
      :call-id="selectedCall.id"
      :ward-id="selectedCall.wardId"
      :dispatcher-id="selectedCall.dispatcherId || authStore.user?.id || ''"
      :ward-phone="selectedCall.ward?.emergencyContact"
      @call-ended="handleVoiceCallEnded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useCallsStore } from '../stores/calls';
import { useAuthStore } from '../stores/auth';
import VoiceCall from '../components/VoiceCall.vue';

const route = useRoute();
const router = useRouter();
const callsStore = useCallsStore();
const authStore = useAuthStore();

const notes = ref('');
const resolveNotes = ref('');
const showResolveDialog = ref(false);
const isVoiceCallActive = ref(false);

const selectedCall = computed(() => callsStore.selectedCall);
const isLoading = computed(() => callsStore.isLoading);

function formatTime(dateString: string) {
  return format(new Date(dateString), 'dd.MM.yyyy HH:mm:ss', { locale: ru });
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    created: 'Создан',
    assigned: 'Назначен',
    in_progress: 'В работе',
    resolved: 'Завершен',
    canceled: 'Отменен',
  };
  return labels[status] || status;
}

async function handleAssign() {
  try {
    await callsStore.assignCall(selectedCall.value!.id);
    await callsStore.fetchCall(selectedCall.value!.id);
  } catch (error) {
    console.error('Failed to assign call:', error);
  }
}

async function handleStart() {
  try {
    await callsStore.updateCallStatus(selectedCall.value!.id, 'in_progress');
    await callsStore.fetchCall(selectedCall.value!.id);
  } catch (error) {
    console.error('Failed to start call:', error);
  }
}

async function handleResolve() {
  try {
    await callsStore.updateCallStatus(selectedCall.value!.id, 'resolved', resolveNotes.value);
    showResolveDialog.value = false;
    router.push('/calls');
  } catch (error) {
    console.error('Failed to resolve call:', error);
  }
}

async function saveNotes() {
  try {
    await callsStore.updateCallStatus(selectedCall.value!.id, selectedCall.value!.status, notes.value);
  } catch (error) {
    console.error('Failed to save notes:', error);
  }
}

function startVoiceCall() {
  if (!selectedCall.value) return;
  
  // Проверяем, что вызов в работе
  if (selectedCall.value.status !== 'in_progress') {
    alert('Сначала начните работу над вызовом');
    return;
  }

  isVoiceCallActive.value = true;
}

function handleVoiceCallEnded() {
  isVoiceCallActive.value = false;
}

onMounted(async () => {
  const callId = route.params.id as string;
  if (callId) {
    await callsStore.fetchCall(callId);
    notes.value = callsStore.selectedCall?.notes || '';
  }
});
</script>

<style scoped>
.call-detail {
  max-width: 1400px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.detail-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.call-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.detail-section {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
}

.detail-section.full-width {
  grid-column: 1 / -1;
}

.detail-section h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.info-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.info-value {
  color: var(--text-primary);
}

.notes-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-family: inherit;
  margin-bottom: 1rem;
}

.dialog-overlay {
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

.dialog {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  max-width: 500px;
  width: 90%;
}

.dialog h3 {
  margin-bottom: 1rem;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.loading,
.empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}
</style>

