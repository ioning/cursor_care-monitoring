import { defineStore } from 'pinia';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

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
    isAuthenticated: (state) => {
      const token = localStorage.getItem('accessToken');
      return !!token && !!state.user;
    },
  },

  actions: {
    async login(email: string, password: string) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          email,
          password,
        });

        console.log('Login response:', response.data);

        // Проверяем структуру ответа
        const responseData = response.data?.data || response.data;
        const { user, tokens } = responseData;

        if (!user || !tokens) {
          throw new Error('Неверный формат ответа от сервера');
        }

        // Проверяем, что пользователь имеет роль admin
        if (user.role !== 'admin' && user.role !== 'organization_admin') {
          throw new Error('Доступ только для администраторов');
        }

        // Сохраняем токены
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);

        // Сохраняем пользователя
        this.user = user;

        console.log('Login successful, user:', user);

        return user;
      } catch (error: any) {
        console.error('Login error details:', error);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Ошибка входа';
        this.error = errorMessage;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async checkAuth() {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('checkAuth: no token');
        this.user = null;
        return false;
      }

      // Если пользователь уже загружен и токен есть, считаем авторизованным
      if (this.user && (this.user.role === 'admin' || this.user.role === 'organization_admin')) {
        console.log('checkAuth: user already loaded, returning true');
        return true;
      }

      try {
        console.log('checkAuth: calling /auth/me');
        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const responseData = response.data?.data || response.data;
        const user = responseData.user || responseData;
        
        console.log('checkAuth: received user:', user);
        
        // Проверяем роль
        if (user.role !== 'admin' && user.role !== 'organization_admin') {
          console.log('checkAuth: invalid role, logging out');
          this.logout();
          return false;
        }

        this.user = user;
        console.log('checkAuth: success, user set');
        return true;
      } catch (error: any) {
        console.error('checkAuth: error', error);
        this.logout();
        return false;
      }
    },

    logout() {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      this.user = null;
      this.error = null;
    },
  },
});

