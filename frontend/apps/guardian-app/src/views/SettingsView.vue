<template>
  <div class="settings-view">
    <h2>Настройки</h2>

    <div class="settings-sections">
      <!-- Profile Section -->
      <div class="card">
        <h3 class="card-title">Профиль</h3>
        <form @submit.prevent="handleUpdateProfile" class="settings-form">
          <div class="form-group">
            <label class="form-label">Полное имя</label>
            <input v-model="profileForm.fullName" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input v-model="profileForm.email" type="email" class="form-input" disabled />
          </div>
          <div class="form-group">
            <label class="form-label">Телефон</label>
            <input v-model="profileForm.phone" type="tel" class="form-input" />
          </div>
          <div v-if="error" class="error-message">{{ error }}</div>
          <div v-if="success" class="success-message">{{ success }}</div>
          <button type="submit" class="btn btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </form>
      </div>

      <!-- Notifications Section -->
      <div class="card">
        <h3 class="card-title">Уведомления</h3>
        <div class="settings-form">
          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="notifications.email" type="checkbox" />
              <span>Email уведомления</span>
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="notifications.push" type="checkbox" />
              <span>Push уведомления</span>
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="notifications.sms" type="checkbox" />
              <span>SMS уведомления</span>
            </label>
          </div>
          <button @click="handleSaveNotifications" class="btn btn-primary">
            Сохранить настройки
          </button>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="card danger-zone">
        <h3 class="card-title">Опасная зона</h3>
        <div class="danger-actions">
          <div>
            <h4>Удалить аккаунт</h4>
            <p>Это действие необратимо. Все ваши данные будут удалены.</p>
          </div>
          <button @click="handleDeleteAccount" class="btn btn-danger">
            Удалить аккаунт
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const isLoading = ref(false);
const error = ref('');
const success = ref('');

const profileForm = reactive({
  fullName: '',
  email: '',
  phone: '',
});

const notifications = reactive({
  email: true,
  push: true,
  sms: false,
});

const handleUpdateProfile = async () => {
  isLoading.value = true;
  error.value = '';
  success.value = '';

  try {
    // In real app, call API to update profile
    await new Promise((resolve) => setTimeout(resolve, 500));
    success.value = 'Профиль обновлен';
    setTimeout(() => {
      success.value = '';
    }, 3000);
  } catch (err: any) {
    error.value = 'Ошибка обновления профиля';
  } finally {
    isLoading.value = false;
  }
};

const handleSaveNotifications = () => {
  // In real app, save notification preferences
  alert('Настройки уведомлений сохранены');
};

const handleDeleteAccount = () => {
  if (confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.')) {
    // In real app, call API to delete account
    authStore.logout();
  }
};

onMounted(() => {
  if (authStore.user) {
    profileForm.fullName = authStore.user.fullName;
    profileForm.email = authStore.user.email;
  }
});
</script>

<style scoped>
.settings-view {
  max-width: 800px;
  margin: 0 auto;
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

.success-message {
  background-color: #d1fae5;
  color: #065f46;
  padding: 0.75rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
}

.danger-zone {
  border: 2px solid var(--danger);
}

.danger-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.danger-actions h4 {
  color: var(--danger);
  margin-bottom: 0.5rem;
}

.danger-actions p {
  color: var(--gray-600);
  font-size: 0.875rem;
}
</style>

