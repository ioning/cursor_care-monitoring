<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <RouterLink to="/" class="logo">
            <span class="logo-icon">🏥</span>
            <span class="logo-text">Care Monitoring</span>
          </RouterLink>
          <h1 class="auth-title">Регистрация</h1>
          <p class="auth-subtitle">Создайте аккаунт и начните использовать систему</p>
        </div>

        <form @submit.prevent="handleRegister" class="auth-form">
          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="form-group">
            <label for="fullName" class="form-label">ФИО</label>
            <input
              id="fullName"
              v-model="form.fullName"
              type="text"
              class="form-input"
              placeholder="Иван Иванов"
              required
            />
          </div>

          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="form-input"
              placeholder="your@email.com"
              required
            />
          </div>

          <div class="form-group">
            <label for="phone" class="form-label">Телефон (необязательно)</label>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              class="form-input"
              placeholder="+7 (999) 123-45-67"
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Пароль</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="form-input"
              placeholder="Минимум 8 символов"
              required
              minlength="8"
            />
          </div>

          <div class="form-group">
            <label for="role" class="form-label">Роль</label>
            <select id="role" v-model="form.role" class="form-input" required>
              <option value="guardian">Опекун</option>
              <option value="ward">Подопечный</option>
              <option value="dispatcher">Диспетчер</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>
            Уже есть аккаунт?
            <RouterLink to="/login" class="auth-link">Войти</RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();

const form = ref({
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'guardian',
  organizationId: undefined as string | undefined,
});

const loading = computed(() => authStore.loading);
const error = computed(() => authStore.error);

onMounted(() => {
  // Получаем план из query параметров
  const plan = route.query.plan as string;
  if (plan) {
    // Можно установить organizationId в зависимости от плана
    // Для MVP оставляем пустым
  }
});

const handleRegister = async () => {
  try {
    await authStore.register({
      ...form.value,
      organizationId: form.value.organizationId || undefined,
    });
  } catch (err) {
    // Ошибка уже обработана в store
  }
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.auth-container {
  width: 100%;
  max-width: 450px;
}

.auth-card {
  background: white;
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  text-decoration: none;
  margin-bottom: 1.5rem;
}

.logo-icon {
  font-size: 2rem;
}

.auth-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.auth-subtitle {
  color: var(--text-light);
}

.auth-form {
  margin-bottom: 1.5rem;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(140, 94, 255, 0.1);
}

select.form-input {
  cursor: pointer;
}

.auth-footer {
  text-align: center;
  color: var(--text-light);
}

.auth-link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>




