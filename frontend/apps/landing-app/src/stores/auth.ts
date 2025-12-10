import { defineStore } from 'pinia';
import { login, register, verifyEmail, resendVerificationCode, getDashboardUrl, type LoginRequest, type RegisterRequest, type VerifyEmailRequest, type ResendVerificationCodeRequest } from '@/api/auth.api';
import { useRouter } from 'vue-router';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  organizationId?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    dashboardUrl: (state) => {
      if (!state.user) return null;
      return getDashboardUrl(state.user.role, state.user.organizationId);
    },
  },

  actions: {
    async login(credentials: LoginRequest) {
      this.loading = true;
      this.error = null;

      try {
        const response = await login(credentials);
        
        // Сохраняем токены
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        
        // Сохраняем пользователя
        this.user = response.data.user;

        // Перенаправляем в соответствующий личный кабинет
        const dashboardUrl = getDashboardUrl(this.user.role, this.user.organizationId);
        window.location.href = dashboardUrl;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Ошибка входа. Проверьте данные.';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async register(data: RegisterRequest) {
      this.loading = true;
      this.error = null;

      try {
        const response = await register(data);
        
        // Если требуется верификация email, возвращаем ответ без токенов
        if (response.requiresEmailVerification) {
          this.user = response.data.user;
          return { requiresVerification: true, email: response.data.user.email };
        }
        
        // Если токены есть, значит регистрация прошла успешно
        if (response.data && 'tokens' in response.data) {
          localStorage.setItem('accessToken', response.data.tokens.accessToken);
          localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
          this.user = response.data.user;

          const dashboardUrl = getDashboardUrl(this.user.role, this.user.organizationId);
          window.location.href = dashboardUrl;
        }
        
        return { requiresVerification: true, email: response.data.user.email };
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Ошибка регистрации. Попробуйте снова.';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async verifyEmail(data: VerifyEmailRequest) {
      this.loading = true;
      this.error = null;

      try {
        const response = await verifyEmail(data);
        
        // Сохраняем токены
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        
        // Сохраняем пользователя
        this.user = response.data.user;

        // Перенаправляем в соответствующий личный кабинет
        const dashboardUrl = getDashboardUrl(this.user.role, this.user.organizationId);
        window.location.href = dashboardUrl;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Неверный код. Попробуйте снова.';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async resendCode(data: ResendVerificationCodeRequest) {
      this.loading = true;
      this.error = null;

      try {
        await resendVerificationCode(data);
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Ошибка отправки кода. Попробуйте снова.';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      this.user = null;
    },
  },
});



