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
    try {
      const response = await apiClient.instance.post('/auth/login', {
        email,
        password,
      });
      
      // API возвращает { success: true, data: { user, tokens: { accessToken, refreshToken } } }
      const responseData = response.data;
      
      if (responseData.success && responseData.data) {
        const { user, tokens } = responseData.data;
        return {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          },
        };
      }
      
      // Fallback для старого формата (если API напрямую возвращает токены)
      if (responseData.accessToken && responseData.user) {
        return responseData as LoginResponse;
      }
      
      throw new Error('Unexpected response format from login endpoint');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  }

  static async logout(): Promise<void> {
    await apiClient.instance.post('/auth/logout');
  }

  static async getCurrentUser() {
    try {
      const response = await apiClient.instance.get('/auth/me');
      const responseData = response.data;
      
      // API возвращает { success: true, data: { id, email, fullName, role, ... } }
      if (responseData.success && responseData.data) {
        return responseData.data;
      }
      
      // Fallback для старого формата
      return responseData;
    } catch (error: any) {
      console.error('GetCurrentUser error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get user';
      throw new Error(errorMessage);
    }
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const response = await apiClient.instance.post('/auth/refresh', {
        refreshToken,
      });
      const responseData = response.data;
      
      // API возвращает { success: true, data: { accessToken, refreshToken, expiresIn } }
      if (responseData.success && responseData.data) {
        return {
          accessToken: responseData.data.accessToken,
          refreshToken: responseData.data.refreshToken,
        };
      }
      
      // Fallback для старого формата
      if (responseData.accessToken) {
        return {
          accessToken: responseData.accessToken,
          refreshToken: responseData.refreshToken || refreshToken,
        };
      }
      
      throw new Error('Unexpected response format from refresh endpoint');
    } catch (error: any) {
      console.error('RefreshToken error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Token refresh failed';
      throw new Error(errorMessage);
    }
  }
}

