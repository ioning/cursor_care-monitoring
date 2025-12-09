import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi, type LoginDto, type RegisterDto } from '../api/auth.api';
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter();
  const user = ref<{
    id: string;
    email: string;
    fullName: string;
    role: string;
  } | null>(null);
  const isInitialized = ref(false);
  const isLoading = ref(false);

  const isAuthenticated = computed(() => !!user.value);

  const initialize = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      isInitialized.value = true;
      return;
    }

    try {
      const response = await authApi.getMe();
      user.value = response.data;
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      isInitialized.value = true;
    }
  };

  const login = async (credentials: LoginDto) => {
    isLoading.value = true;
    try {
      const response = await authApi.login(credentials);
      user.value = response.data.user;
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      await router.push('/dashboard');
      return response;
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (data: RegisterDto) => {
    isLoading.value = true;
    try {
      const response = await authApi.register(data);
      user.value = response.data.user;
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      await router.push('/dashboard');
      return response;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      user.value = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      await router.push('/login');
    }
  };

  return {
    user,
    isAuthenticated,
    isInitialized,
    isLoading,
    initialize,
    login,
    register,
    logout,
  };
});

