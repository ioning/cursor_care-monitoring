import { apiClient } from './ApiClient';

export interface Alert {
  id: string;
  alertType: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  createdAt: string;
}

export class AlertService {
  static async getAlerts(params?: { wardId?: string }): Promise<Alert[]> {
    const response = await apiClient.instance.get('/alerts', { params });
    const payload = response.data?.data ?? response.data;
    return Array.isArray(payload) ? payload : [];
  }

  static async updateAlertStatus(alertId: string, status: string): Promise<void> {
    await apiClient.instance.put(`/alerts/${alertId}/status`, { status });
  }
}

