<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <RouterLink to="/" class="logo">
            <span class="logo-icon">🏥</span>
            <span class="logo-text">Care Monitoring</span>
          </RouterLink>
          <h1 class="auth-title">Вход в систему</h1>
          <p class="auth-subtitle">Войдите в свой личный кабинет</p>
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
          <div v-if="error" class="error-message">{{ error }}</div>

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
            <label for="password" class="form-label">Пароль</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="form-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            {{ loading ? 'Вход...' : 'Войти' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>
            Нет аккаунта?
            <RouterLink to="/register" class="auth-link">Зарегистрироваться</RouterLink>
          </p>
        </div>

        <div class="auth-divider">
          <span>Или перейти в</span>
        </div>

        <div class="auth-dashboards">
          <a :href="guardianAppUrl" class="dashboard-link" target="_blank">
            <span class="dashboard-icon">👤</span>
            <span>Кабинет опекуна</span>
          </a>
          <a :href="dispatcherAppUrl" class="dashboard-link" target="_blank">
            <span class="dashboard-icon">📞</span>
            <span>Кабинет диспетчера</span>
          </a>
          <a :href="adminAppUrl" class="dashboard-link" target="_blank">
            <span class="dashboard-icon">⚙️</span>
            <span>Админ панель</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const form = ref({
  email: '',
  password: '',
});

const loading = computed(() => authStore.loading);
const error = computed(() => authStore.error);

const guardianAppUrl = computed(() => import.meta.env.VITE_GUARDIAN_APP_URL || 'http://localhost:5173');
const dispatcherAppUrl = computed(() => import.meta.env.VITE_DISPATCHER_APP_URL || 'http://localhost:5174');
const adminAppUrl = computed(() => import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5185');

const handleLogin = async () => {
  try {
    await authStore.login(form.value);
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

.auth-divider {
  text-align: center;
  margin: 2rem 0;
  position: relative;
}

.auth-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--border);
}

.auth-divider span {
  background: white;
  padding: 0 1rem;
  position: relative;
  color: var(--text-light);
}

.auth-dashboards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dashboard-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  text-decoration: none;
  color: var(--text);
  transition: all 0.2s;
}

.dashboard-link:hover {
  border-color: var(--primary);
  background: var(--bg-light);
}

.dashboard-icon {
  font-size: 1.5rem;
}
</style>







