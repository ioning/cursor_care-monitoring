import apiClient from './client';

export interface EmergencyCall {
  id: string;
  wardId: string;
  callType: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'created' | 'assigned' | 'in_progress' | 'resolved' | 'canceled';
  dispatcherId?: string;
  source: string;
  healthSnapshot?: Record<string, any>;
  locationSnapshot?: Record<string, any>;
  aiAnalysis?: Record<string, any>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
  resolvedAt?: string;
  ward?: {
    id: string;
    fullName: string;
    medicalInfo?: string;
    emergencyContact?: string;
  };
}

export interface CallFilters {
  status?: string;
  priority?: string;
  dispatcherId?: string;
  page?: number;
  limit?: number;
}

export interface CallsResponse {
  calls: EmergencyCall[];
  total: number;
  page: number;
  limit: number;
}

export const dispatcherApi = {
  async getCalls(filters: CallFilters = {}): Promise<CallsResponse> {
    const response = await apiClient.get('/dispatcher/calls', { params: filters });
    return response.data;
  },

  async getCall(callId: string): Promise<EmergencyCall> {
    const response = await apiClient.get(`/dispatcher/calls/${callId}`);
    // Handle both old and new response formats
    return response.data.data || response.data;
  },

  async assignCall(callId: string): Promise<EmergencyCall> {
    const response = await apiClient.post(`/dispatcher/calls/${callId}/assign`);
    // Handle both old and new response formats
    return response.data.data || response.data;
  },

  async updateCallStatus(
    callId: string,
    status: string,
    notes?: string,
  ): Promise<EmergencyCall> {
    const response = await apiClient.put(`/dispatcher/calls/${callId}/status`, {
      status,
      notes,
    });
    // Handle both old and new response formats
    return response.data.data || response.data;
  },

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const response = await apiClient.get('/dispatcher/stats');
    return response.data;
  },
};

