<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <RouterLink to="/" class="logo">
            <img src="/logo.jpg" alt="Care Monitoring" class="logo-icon" />
            <span class="logo-text">Care Monitoring</span>
          </RouterLink>
          <h1 class="auth-title">Регистрация</h1>
          <p class="auth-subtitle">Создайте аккаунт и начните использовать систему</p>
        </div>

        <!-- Форма регистрации -->
        <form v-if="!showVerification" @submit.prevent="handleRegister" class="auth-form">
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

        <!-- Форма верификации email -->
        <form v-else @submit.prevent="handleVerifyEmail" class="auth-form">
          <div class="verification-info">
            <p>Код подтверждения отправлен на <strong>{{ form.email }}</strong></p>
            <p class="verification-hint">Введите 4-значный код из письма</p>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>
          <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

          <div class="form-group">
            <label for="code" class="form-label">Код подтверждения</label>
            <input
              id="code"
              v-model="verificationCode"
              type="text"
              class="form-input code-input"
              placeholder="1234"
              maxlength="4"
              pattern="[0-9]{4}"
              required
              @input="verificationCode = verificationCode.replace(/\D/g, '')"
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            {{ loading ? 'Проверка...' : 'Подтвердить' }}
          </button>

          <button
            type="button"
            class="btn btn-secondary btn-block"
            :disabled="loading || resendCooldown > 0"
            @click="handleResendCode"
            style="margin-top: 1rem;"
          >
            {{ resendCooldown > 0 ? `Повторить отправку (${resendCooldown}с)` : 'Отправить код повторно' }}
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
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

const showVerification = ref(false);
const verificationCode = ref('');
const successMessage = ref('');
const resendCooldown = ref(0);
let resendTimer: ReturnType<typeof setInterval> | null = null;

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

onUnmounted(() => {
  if (resendTimer) {
    clearInterval(resendTimer);
  }
});

const handleRegister = async () => {
  try {
    const result = await authStore.register({
      ...form.value,
      organizationId: form.value.organizationId || undefined,
    });

    if (result && result.requiresVerification) {
      showVerification.value = true;
      successMessage.value = 'Регистрация успешна! Проверьте почту для получения кода.';
      startResendCooldown();
    }
  } catch (err) {
    // Ошибка уже обработана в store
  }
};

const handleVerifyEmail = async () => {
  if (verificationCode.value.length !== 4) {
    return;
  }

  try {
    await authStore.verifyEmail({
      email: form.value.email,
      code: verificationCode.value,
    });
    // После успешной верификации происходит редирект в store
  } catch (err) {
    // Ошибка уже обработана в store
    verificationCode.value = '';
  }
};

const handleResendCode = async () => {
  if (resendCooldown.value > 0) return;

  try {
    await authStore.resendCode({ email: form.value.email });
    successMessage.value = 'Код отправлен повторно!';
    startResendCooldown();
  } catch (err) {
    // Ошибка уже обработана в store
  }
};

const startResendCooldown = () => {
  resendCooldown.value = 60;
  resendTimer = setInterval(() => {
    resendCooldown.value--;
    if (resendCooldown.value <= 0 && resendTimer) {
      clearInterval(resendTimer);
      resendTimer = null;
    }
  }, 1000);
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
  height: 2rem;
  width: auto;
  object-fit: contain;
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

.verification-info {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.verification-info p {
  margin: 0.25rem 0;
  color: #0369a1;
}

.verification-hint {
  font-size: 0.875rem;
  color: #0284c7;
}

.code-input {
  font-size: 1.5rem;
  text-align: center;
  letter-spacing: 0.5rem;
  font-weight: 600;
}

.success-message {
  background: #dcfce7;
  color: #16a34a;
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>




