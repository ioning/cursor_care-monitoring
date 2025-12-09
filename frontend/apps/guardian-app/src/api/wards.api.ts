import { apiClient } from './client';

export interface Ward {
  id: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  medicalInfo?: string;
  emergencyContact?: string;
  relationship?: string;
  linkedAt?: string;
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

export const wardsApi = {
  getWards: async (): Promise<{ success: boolean; data: Ward[] }> => {
    const response = await apiClient.get('/users/wards');
    return response.data;
  },

  getWard: async (wardId: string): Promise<{ success: boolean; data: Ward }> => {
    const response = await apiClient.get(`/users/wards/${wardId}`);
    return response.data;
  },

  createWard: async (data: CreateWardDto): Promise<{ success: boolean; data: Ward }> => {
    const response = await apiClient.post('/users/wards', data);
    return response.data;
  },

  updateWard: async (
    wardId: string,
    data: UpdateWardDto,
  ): Promise<{ success: boolean; data: Ward }> => {
    const response = await apiClient.put(`/users/wards/${wardId}`, data);
    return response.data;
  },

  deleteWard: async (wardId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/users/wards/${wardId}`);
    return response.data;
  },
};

