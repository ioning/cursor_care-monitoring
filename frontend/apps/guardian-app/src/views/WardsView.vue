<template>
  <div class="wards-view">
    <div class="page-header">
      <h2>Подопечные</h2>
      <button @click="showCreateModal = true" class="btn btn-primary">+ Добавить подопечного</button>
    </div>

    <div v-if="wardsStore.isLoading" class="loading">Загрузка...</div>
    <div v-else-if="wardsStore.wards.length === 0" class="empty-state">
      <p>Нет подопечных</p>
      <button @click="showCreateModal = true" class="btn btn-primary">Добавить первого подопечного</button>
    </div>
    <div v-else class="wards-grid">
      <div
        v-for="ward in wardsStore.wards"
        :key="ward.id"
        class="ward-card"
        @click="$router.push(`/wards/${ward.id}`)"
      >
        <div class="ward-avatar-large">{{ ward.fullName.charAt(0) }}</div>
        <div class="ward-info">
          <h3 class="ward-name">{{ ward.fullName }}</h3>
          <div class="ward-details">
            <span v-if="ward.dateOfBirth">{{ calculateAge(ward.dateOfBirth) }} лет</span>
            <span v-if="ward.gender"> • {{ ward.gender === 'male' ? 'Мужской' : 'Женский' }}</span>
          </div>
          <div v-if="ward.medicalInfo" class="ward-medical">
            <span class="badge badge-info">Медицинская информация</span>
          </div>
        </div>
        <div class="ward-actions">
          <button
            @click.stop="handleEdit(ward)"
            class="btn btn-secondary"
          >
            Редактировать
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || editingWard" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingWard ? 'Редактировать подопечного' : 'Добавить подопечного' }}</h3>
          <button @click="closeModal" class="modal-close">×</button>
        </div>
        <form @submit.prevent="handleSubmit" class="modal-body">
          <div class="form-group">
            <label class="form-label">Полное имя *</label>
            <input v-model="form.fullName" type="text" class="form-input" required />
          </div>
          <div v-if="!editingWard" class="form-group">
            <label class="form-label">Телефон *</label>
            <input 
              v-model="form.phone" 
              type="tel" 
              class="form-input" 
              placeholder="+79001234567"
              pattern="\+7\d{10}"
              required 
            />
            <small class="form-hint">Формат: +7XXXXXXXXXX</small>
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
              {{ editingWard ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Password Modal -->
    <div v-if="showPasswordModal" class="modal-overlay" @click="showPasswordModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Пароль для входа подопечного</h3>
          <button @click="showPasswordModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="password-info">
            <p>Подопечному отправлено SMS с данными для входа.</p>
            <p class="password-label">Сгенерированный пароль:</p>
            <div class="password-display">
              <code class="password-text">{{ generatedPassword }}</code>
              <button 
                @click="copyPassword" 
                class="btn btn-secondary btn-small"
                title="Копировать пароль"
              >
                📋 Копировать
              </button>
            </div>
            <p class="password-warning">⚠️ Сохраните этот пароль! Он больше не будет показан.</p>
          </div>
          <div class="modal-footer">
            <button @click="showPasswordModal = false" class="btn btn-primary">Понятно</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useWardsStore } from '../stores/wards';
import type { Ward } from '../api/wards.api';

const wardsStore = useWardsStore();
const showCreateModal = ref(false);
const editingWard = ref<Ward | null>(null);
const error = ref('');

const form = reactive({
  fullName: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  medicalInfo: '',
  emergencyContact: '',
});

const showPasswordModal = ref(false);
const generatedPassword = ref('');

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

const handleEdit = (ward: Ward) => {
  editingWard.value = ward;
  form.fullName = ward.fullName;
  form.dateOfBirth = ward.dateOfBirth || '';
  form.gender = ward.gender || '';
  form.medicalInfo = ward.medicalInfo || '';
  form.emergencyContact = ward.emergencyContact || '';
  showCreateModal.value = true;
};

const handleSubmit = async () => {
  error.value = '';
  try {
    if (editingWard.value) {
      // При обновлении не отправляем phone
      const { phone, ...updateData } = form;
      await wardsStore.updateWard(editingWard.value.id, updateData);
      closeModal();
    } else {
      const result = await wardsStore.createWard(form);
      closeModal();
      if (result.temporaryPassword) {
        generatedPassword.value = result.temporaryPassword;
        showPasswordModal.value = true;
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Ошибка сохранения';
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  editingWard.value = null;
  Object.assign(form, {
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    medicalInfo: '',
    emergencyContact: '',
  });
  error.value = '';
};

const copyPassword = async () => {
  try {
    await navigator.clipboard.writeText(generatedPassword.value);
    // Можно добавить уведомление об успешном копировании
  } catch (err) {
    console.error('Failed to copy password:', err);
  }
};

onMounted(() => {
  wardsStore.fetchWards();
});
</script>

<style scoped>
.wards-view {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.wards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.ward-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ward-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.ward-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 2rem;
  margin: 0 auto;
}

.ward-info {
  text-align: center;
}

.ward-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.ward-details {
  color: var(--gray-600);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.ward-medical {
  margin-top: 0.5rem;
}

.ward-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
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
  background: white;
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-200);
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--gray-500);
  cursor: pointer;
  line-height: 1;
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
  background-color: #fee2e2;
  color: var(--danger);
  padding: 0.75rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  color: var(--gray-500);
  font-size: 0.75rem;
}

.password-info {
  text-align: center;
}

.password-info p {
  margin-bottom: 1rem;
  color: var(--gray-700);
}

.password-label {
  font-weight: 600;
  margin-top: 1.5rem !important;
}

.password-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin: 1rem 0;
  padding: 1rem;
  background: var(--gray-100);
  border-radius: var(--radius);
}

.password-text {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--primary);
  font-family: 'Courier New', monospace;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.password-warning {
  margin-top: 1.5rem !important;
  color: var(--warning) !important;
  font-weight: 500;
}
</style>

