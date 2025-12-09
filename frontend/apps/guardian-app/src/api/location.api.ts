import apiClient from './client';

export interface Location {
  id: string;
  wardId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: string;
  timestamp: string;
  createdAt: string;
}

export interface LocationHistoryResponse {
  success: boolean;
  data: Location[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Geofence {
  id: string;
  wardId: string;
  name: string;
  type: 'safe_zone' | 'restricted_zone';
  centerLatitude: number;
  centerLongitude: number;
  radius: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export const locationApi = {
  async getLatestLocation(wardId: string): Promise<Location | null> {
    try {
      const response = await apiClient.get(`/locations/wards/${wardId}/latest`);
      return response.data.data || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getLocationHistory(
    wardId: string,
    filters?: {
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<LocationHistoryResponse> {
    const response = await apiClient.get(`/locations/wards/${wardId}/history`, {
      params: filters,
    });
    return response.data;
  },

  async getGeofences(wardId: string): Promise<Geofence[]> {
    const response = await apiClient.get('/locations/geofences', {
      params: { wardId },
    });
    return response.data.data || [];
  },

  async createGeofence(wardId: string, data: {
    name: string;
    type: 'safe_zone' | 'restricted_zone';
    centerLatitude: number;
    centerLongitude: number;
    radius: number;
  }): Promise<Geofence> {
    const response = await apiClient.post('/locations/geofences', {
      wardId,
      ...data,
    });
    return response.data.data;
  },
};



export interface Location {
  id: string;
  wardId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: string;
  timestamp: string;
  createdAt: string;
}

export interface LocationHistoryResponse {
  success: boolean;
  data: Location[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Geofence {
  id: string;
  wardId: string;
  name: string;
  type: 'safe_zone' | 'restricted_zone';
  centerLatitude: number;
  centerLongitude: number;
  radius: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export const locationApi = {
  async getLatestLocation(wardId: string): Promise<Location | null> {
    try {
      const response = await apiClient.get(`/locations/wards/${wardId}/latest`);
      return response.data.data || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getLocationHistory(
    wardId: string,
    filters?: {
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<LocationHistoryResponse> {
    const response = await apiClient.get(`/locations/wards/${wardId}/history`, {
      params: filters,
    });
    return response.data;
  },

  async getGeofences(wardId: string): Promise<Geofence[]> {
    const response = await apiClient.get('/locations/geofences', {
      params: { wardId },
    });
    return response.data.data || [];
  },

  async createGeofence(wardId: string, data: {
    name: string;
    type: 'safe_zone' | 'restricted_zone';
    centerLatitude: number;
    centerLongitude: number;
    radius: number;
  }): Promise<Geofence> {
    const response = await apiClient.post('/locations/geofences', {
      wardId,
      ...data,
    });
    return response.data.data;
  },
};







