import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api/v1'
  : 'https://api.caremonitoring.com/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add token and content type
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // Set Content-Type only if not FormData
        if (!(config.data instanceof FormData)) {
          config.headers['Content-Type'] = 'application/json';
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const refreshToken = await AsyncStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });
              const newToken = response.data.accessToken;
              await AsyncStorage.setItem('token', newToken);
              // Retry original request
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${newToken}`;
                return this.client.request(error.config);
              }
            } catch (refreshError) {
              // Refresh failed, logout
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('refreshToken');
              // Navigate to login (handled by app)
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  get instance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
