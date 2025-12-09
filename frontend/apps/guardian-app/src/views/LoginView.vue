<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Care Monitoring</h1>
          <p>Войдите в систему</p>
        </div>
        <form @submit.prevent="handleLogin" class="login-form">
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
            <label class="form-label">Пароль</label>
            <input
              v-model="form.password"
              type="password"
              class="form-input"
              placeholder="••••••••"
              required
            />
          </div>
          <div v-if="error" class="error-message">{{ error }}</div>
          <button type="submit" class="btn btn-primary" :disabled="authStore.isLoading">
            {{ authStore.isLoading ? 'Вход...' : 'Войти' }}
          </button>
        </form>
        <div class="login-footer">
          <p>
            Нет аккаунта?
            <RouterLink to="/register" class="link">Зарегистрироваться</RouterLink>
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
  email: '',
  password: '',
});

const error = ref('');

const handleLogin = async () => {
  error.value = '';
  try {
    await authStore.login(form.value);
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Ошибка входа';
  }
};
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 2.5rem;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: var(--gray-600);
  font-size: 0.875rem;
}

.login-form {
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

.login-footer {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid var(--gray-200);
}

.login-footer p {
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

