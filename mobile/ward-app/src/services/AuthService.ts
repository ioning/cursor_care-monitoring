import { apiClient } from './ApiClient';

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

export class AuthService {
  static async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.instance.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  static async logout(): Promise<void> {
    await apiClient.instance.post('/auth/logout');
  }

  static async getCurrentUser() {
    const response = await apiClient.instance.get('/auth/me');
    return response.data;
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await apiClient.instance.post('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  }
}

