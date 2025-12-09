<template>
  <div class="login-container">
    <div class="login-card">
      <h1>🚨 Dispatcher</h1>
      <h2>Вход в систему</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="email@example.com"
          />
        </div>
        <div class="form-group">
          <label for="password">Пароль</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
          />
        </div>
        <button type="submit" class="btn btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Вход...' : 'Войти' }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const error = ref('');

async function handleLogin() {
  isLoading.value = true;
  error.value = '';

  try {
    await authStore.login(email.value, password.value);
    
    // Check if user is dispatcher
    if (authStore.user?.role !== 'dispatcher' && authStore.user?.role !== 'admin') {
      authStore.logout();
      error.value = 'Доступ только для диспетчеров';
      return;
    }

    router.push('/dashboard');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Ошибка входа';
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
}

.login-card h1 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.login-card h2 {
  text-align: center;
  color: var(--text-secondary);
  font-size: 1.25rem;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.btn {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
}

.error {
  margin-top: 1rem;
  color: var(--danger-color);
  text-align: center;
  font-size: 0.875rem;
}
</style>

