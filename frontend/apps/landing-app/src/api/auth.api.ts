import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: string;
  organizationId?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
      organizationId?: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  };
  message?: string;
}

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', data);
  return response.data;
};

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', data);
  return response.data;
};

export const getDashboardUrl = (role: string, organizationId?: string): string => {
  const baseUrls = {
    guardian: import.meta.env.VITE_GUARDIAN_APP_URL || 'http://localhost:5173',
    dispatcher: import.meta.env.VITE_DISPATCHER_APP_URL || 'http://localhost:5174',
    admin: import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5185',
    organization_admin: import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5185',
  };

  const url = baseUrls[role as keyof typeof baseUrls] || baseUrls.guardian;
  
  // Передаем токен через URL параметр для автоматического входа
  const token = localStorage.getItem('accessToken');
  if (token) {
    return `${url}?token=${token}`;
  }
  
  return url;
};







