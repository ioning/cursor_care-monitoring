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

        const { user, tokens } = response.data.data;

        // Проверяем, что пользователь имеет роль admin
        if (user.role !== 'admin' && user.role !== 'organization_admin') {
          throw new Error('Доступ только для администраторов');
        }

        // Сохраняем токены
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);

        // Сохраняем пользователя
        this.user = user;

        return user;
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Ошибка входа';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async checkAuth() {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        this.user = null;
        return false;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const user = response.data.data.user;
        
        // Проверяем роль
        if (user.role !== 'admin' && user.role !== 'organization_admin') {
          this.logout();
          return false;
        }

        this.user = user;
        return true;
      } catch (error) {
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

