<template>
  <div class="register-view">
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <h1>Care Monitoring</h1>
          <p>Создайте аккаунт</p>
        </div>
        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label class="form-label">Полное имя</label>
            <input
              v-model="form.fullName"
              type="text"
              class="form-input"
              placeholder="Иванов Иван Иванович"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input
              v-model="form.email"
              type="email"
              class="form-input"
              placeholder="email@example.com"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label">Телефон (необязательно)</label>
            <input
              v-model="form.phone"
              type="tel"
              class="form-input"
              placeholder="+7 (999) 123-45-67"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Пароль</label>
            <input
              v-model="form.password"
              type="password"
              class="form-input"
              placeholder="Минимум 8 символов"
              required
              minlength="8"
            />
          </div>
          <div v-if="error" class="error-message">{{ error }}</div>
          <button type="submit" class="btn btn-primary" :disabled="authStore.isLoading">
            {{ authStore.isLoading ? 'Регистрация...' : 'Зарегистрироваться' }}
          </button>
        </form>
        <div class="register-footer">
          <p>
            Уже есть аккаунт?
            <RouterLink to="/login" class="link">Войти</RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'guardian',
});

const error = ref('');

const handleRegister = async () => {
  error.value = '';
  try {
    await authStore.register(form.value);
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Ошибка регистрации';
  }
};
</script>

<style scoped>
.register-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.register-container {
  width: 100%;
  max-width: 400px;
}

.register-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 2.5rem;
}

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.register-header h1 {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.register-header p {
  color: var(--gray-600);
  font-size: 0.875rem;
}

.register-form {
  margin-bottom: 1.5rem;
}

.error-message {
  background-color: #fee2e2;
  color: var(--danger);
  padding: 0.75rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.register-footer {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid var(--gray-200);
}

.register-footer p {
  color: var(--gray-600);
  font-size: 0.875rem;
}

.link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.btn {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
}
</style>

