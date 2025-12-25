import { apiClient } from './ApiClient';

export interface EmergencyCall {
  id: string;
  wardId: string;
  callType: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'created' | 'assigned' | 'in_progress' | 'resolved' | 'canceled';
  source: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  healthSnapshot?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCallDto {
  callType: 'emergency' | 'check-in' | 'assistance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export class CallService {
  /**
   * Создать экстренный вызов
   */
  static async createCall(data: CreateCallDto): Promise<EmergencyCall> {
    try {
      const response = await apiClient.instance.post('/dispatcher/calls', data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to create call:', error);
      throw error;
    }
  }

  /**
   * Получить информацию о звонке
   */
  static async getCall(callId: string): Promise<EmergencyCall> {
    try {
      const response = await apiClient.instance.get(`/dispatcher/calls/${callId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to get call:', error);
      throw error;
    }
  }

  /**
   * Принять входящий звонок (обновить статус на 'in_progress')
   */
  static async accept(callId: string): Promise<EmergencyCall> {
    try {
      const response = await apiClient.instance.put(`/dispatcher/calls/${callId}/status`, {
        status: 'in_progress',
        notes: 'Call accepted by ward',
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to accept call:', error);
      throw error;
    }
  }

  /**
   * Отклонить входящий звонок (обновить статус на 'canceled')
   */
  static async decline(callId: string, reason?: string): Promise<EmergencyCall> {
    try {
      const response = await apiClient.instance.put(`/dispatcher/calls/${callId}/status`, {
        status: 'canceled',
        notes: reason || 'Call declined by ward',
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Failed to decline call:', error);
      throw error;
    }
  }

  /**
   * Получить активные звонки для текущего пользователя (ward)
   */
  static async getActiveCalls(): Promise<EmergencyCall[]> {
    try {
      const response = await apiClient.instance.get('/dispatcher/calls', {
        params: {
          status: 'created,assigned',
          limit: 10,
        },
      });
      const calls = response.data.calls || response.data.data || response.data;
      return Array.isArray(calls) ? calls : [];
    } catch (error) {
      console.error('Failed to get active calls:', error);
      return [];
    }
  }

  /**
   * Получить входящие звонки для текущего пользователя (ward)
   * Используется для polling
   */
  static async getIncomingCalls(wardId: string): Promise<EmergencyCall[]> {
    try {
      const response = await apiClient.instance.get('/dispatcher/calls', {
        params: {
          wardId,
          status: 'created,assigned',
          limit: 10,
        },
      });
      const calls = response.data.calls || response.data.data || response.data;
      return Array.isArray(calls) ? calls.filter((call: EmergencyCall) => call.wardId === wardId) : [];
    } catch (error) {
      console.error('Failed to get incoming calls:', error);
      return [];
    }
  }
}

