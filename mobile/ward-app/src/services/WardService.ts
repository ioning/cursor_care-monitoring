import { apiClient } from './ApiClient';

export interface Ward {
  id: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  medicalInfo?: string;
  emergencyContact?: string;
  relationship?: string;
  linkedAt?: string;
  avatarUrl?: string;
}

export interface CreateWardDto {
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  relationship?: string;
  medicalInfo?: string;
  emergencyContact?: string;
}

export interface UpdateWardDto {
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  medicalInfo?: string;
  emergencyContact?: string;
}

export class WardService {
  static async getWards(): Promise<Ward[]> {
    try {
      const response = await apiClient.instance.get('/users/wards');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch wards:', error);
      throw error;
    }
  }

  static async getWard(wardId: string): Promise<Ward> {
    try {
      const response = await apiClient.instance.get(`/users/wards/${wardId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch ward:', error);
      throw error;
    }
  }

  static async createWard(data: CreateWardDto): Promise<Ward> {
    try {
      const response = await apiClient.instance.post('/users/wards', data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to create ward:', error);
      throw error;
    }
  }

  static async updateWard(wardId: string, data: UpdateWardDto): Promise<Ward> {
    try {
      const response = await apiClient.instance.put(`/users/wards/${wardId}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to update ward:', error);
      throw error;
    }
  }

  static async deleteWard(wardId: string): Promise<void> {
    try {
      await apiClient.instance.delete(`/users/wards/${wardId}`);
    } catch (error) {
      console.error('Failed to delete ward:', error);
      throw error;
    }
  }

  static async uploadAvatar(wardId: string, imageUri: string): Promise<Ward> {
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const response = await apiClient.instance.post(
        `/users/wards/${wardId}/avatar`,
        formData,
        {
          headers: {
            // Don't set Content-Type, let axios set it with boundary
          },
          transformRequest: () => formData, // Prevent axios from serializing
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw error;
    }
  }
}




export interface Ward {
  id: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  medicalInfo?: string;
  emergencyContact?: string;
  relationship?: string;
  linkedAt?: string;
  avatarUrl?: string;
}

export interface CreateWardDto {
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  relationship?: string;
  medicalInfo?: string;
  emergencyContact?: string;
}

export interface UpdateWardDto {
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  medicalInfo?: string;
  emergencyContact?: string;
}

export class WardService {
  static async getWards(): Promise<Ward[]> {
    try {
      const response = await apiClient.instance.get('/users/wards');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch wards:', error);
      throw error;
    }
  }

  static async getWard(wardId: string): Promise<Ward> {
    try {
      const response = await apiClient.instance.get(`/users/wards/${wardId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch ward:', error);
      throw error;
    }
  }

  static async createWard(data: CreateWardDto): Promise<Ward> {
    try {
      const response = await apiClient.instance.post('/users/wards', data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to create ward:', error);
      throw error;
    }
  }

  static async updateWard(wardId: string, data: UpdateWardDto): Promise<Ward> {
    try {
      const response = await apiClient.instance.put(`/users/wards/${wardId}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to update ward:', error);
      throw error;
    }
  }

  static async deleteWard(wardId: string): Promise<void> {
    try {
      await apiClient.instance.delete(`/users/wards/${wardId}`);
    } catch (error) {
      console.error('Failed to delete ward:', error);
      throw error;
    }
  }

  static async uploadAvatar(wardId: string, imageUri: string): Promise<Ward> {
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const response = await apiClient.instance.post(
        `/users/wards/${wardId}/avatar`,
        formData,
        {
          headers: {
            // Don't set Content-Type, let axios set it with boundary
          },
          transformRequest: () => formData, // Prevent axios from serializing
        },
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw error;
    }
  }
}

