<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-logo">
        <img src="/logo.jpg" alt="Care Monitoring" class="logo-image" />
        <h1>Dispatcher</h1>
      </div>
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
  background: var(--bg-color);
  background-image: 
    radial-gradient(at 20% 30%, rgba(239, 68, 68, 0.3) 0px, transparent 50%),
    radial-gradient(at 80% 70%, rgba(245, 158, 11, 0.2) 0px, transparent 50%),
    radial-gradient(at 50% 50%, rgba(220, 38, 38, 0.2) 0px, transparent 50%);
  position: relative;
  overflow: hidden;
  padding: 2rem;
}

.login-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.login-card {
  background: var(--card-bg);
  padding: 3rem;
  border-radius: 20px;
  box-shadow: var(--shadow-glow-primary);
  width: 100%;
  max-width: 450px;
  border: 1px solid var(--border-color);
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-primary);
  border-radius: 20px 20px 0 0;
}

.login-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.logo-image {
  height: 2.5rem;
  width: auto;
  object-fit: contain;
}

.login-card h1 {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
  text-shadow: 0 0 30px rgba(239, 68, 68, 0.5);
}

.login-card h2 {
  text-align: center;
  color: var(--text-secondary);
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 2.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group {
  margin-bottom: 1.75rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input {
  width: 100%;
  padding: 1rem 1.25rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 1rem;
  color: var(--text-primary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
  background: var(--bg-card);
}

.form-group input::placeholder {
  color: var(--text-muted);
}

.btn {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 0.5rem;
}

.error {
  margin-top: 1.25rem;
  color: var(--danger-color);
  text-align: center;
  font-size: 0.875rem;
  padding: 0.875rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  font-weight: 500;
}
</style>

