import apiClient from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    // API Gateway возвращает { success: true, data: { user, tokens } }
    // Преобразуем в ожидаемую структуру
    const data = response.data;
    if (data?.success && data?.data) {
      return {
        accessToken: data.data.tokens.accessToken,
        refreshToken: data.data.tokens.refreshToken,
        user: data.data.user,
      };
    }
    // Если структура уже правильная (для обратной совместимости)
    return data;
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    // API Gateway возвращает { success: true, data: { user, tokens } }
    const data = response.data;
    if (data?.success && data?.data) {
      return {
        accessToken: data.data.tokens.accessToken,
        refreshToken: data.data.tokens.refreshToken,
        user: data.data.user,
      };
    }
    return data;
  },
};

