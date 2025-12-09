import { apiClient } from './client';

export interface Alert {
  id: string;
  wardId: string;
  alertType: string;
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'false_positive';
  aiConfidence?: number;
  riskScore?: number;
  priority?: number;
  dataSnapshot?: Record<string, any>;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface AlertsResponse {
  success: boolean;
  data: Alert[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateAlertStatusDto {
  status: Alert['status'];
}

export const alertsApi = {
  getAlerts: async (filters?: {
    wardId?: string;
    status?: string;
    severity?: string;
    page?: number;
    limit?: number;
  }): Promise<AlertsResponse> => {
    const response = await apiClient.get('/alerts', { params: filters });
    return response.data;
  },

  getAlert: async (alertId: string): Promise<{ success: boolean; data: Alert }> => {
    const response = await apiClient.get(`/alerts/${alertId}`);
    return response.data;
  },

  updateStatus: async (
    alertId: string,
    data: UpdateAlertStatusDto,
  ): Promise<{ success: boolean; data: Alert }> => {
    const response = await apiClient.put(`/alerts/${alertId}/status`, data);
    return response.data;
  },
};

