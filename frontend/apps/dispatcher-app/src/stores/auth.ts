import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi, type LoginResponse } from '../api/auth.api';

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'));
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'));
  const user = ref<LoginResponse['user'] | null>(null);
  const isInitialized = ref(false);

  const isAuthenticated = computed(() => !!accessToken.value);

  async function initialize() {
    const token = localStorage.getItem('accessToken');
    if (token) {
      accessToken.value = token;
      refreshToken.value = localStorage.getItem('refreshToken');
      // Можно добавить загрузку данных пользователя
    }
    isInitialized.value = true;
  }

  async function login(email: string, password: string) {
    const response = await authApi.login({ email, password });
    
    accessToken.value = response.accessToken;
    refreshToken.value = response.refreshToken;
    user.value = response.user;

    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);

    return response;
  }

  function logout() {
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    isInitialized,
    initialize,
    login,
    logout,
  };
});

