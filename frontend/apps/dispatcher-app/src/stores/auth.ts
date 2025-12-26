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
    // Check for token in URL parameter (from landing page redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      // Save token from URL
      localStorage.setItem('accessToken', tokenFromUrl);
      accessToken.value = tokenFromUrl;
      refreshToken.value = localStorage.getItem('refreshToken');
      
      // Remove token from URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Try to get user info
      try {
        const response = await authApi.getMe();
        user.value = response;
        
        // Check if user is dispatcher or admin
        if (response.role !== 'dispatcher' && response.role !== 'admin') {
          // Clear tokens and redirect to login
          logout();
          window.location.href = '/login';
          return;
        }
      } catch (error) {
        console.error('Failed to get user info:', error);
        // If token is invalid, clear it
        logout();
      }
    } else {
      // Check localStorage
      const token = localStorage.getItem('accessToken');
      if (token) {
        accessToken.value = token;
        refreshToken.value = localStorage.getItem('refreshToken');
        // Try to get user info
        try {
          const response = await authApi.getMe();
          user.value = response;
          
          // Check if user is dispatcher or admin
          if (response.role !== 'dispatcher' && response.role !== 'admin') {
            // Clear tokens and redirect to login
            logout();
            window.location.href = '/login';
            return;
          }
        } catch (error) {
          console.error('Failed to get user info:', error);
          // If token is invalid, clear it
          logout();
        }
      }
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

