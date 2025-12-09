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

export interface WardLocation {
  wardId: string;
  wardName: string;
  location: Location | null;
  lastSeen?: string;
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

  async getWardsLocations(wardIds: string[]): Promise<WardLocation[]> {
    // Fetch locations for multiple wards in parallel
    const promises = wardIds.map(async (wardId) => {
      try {
        const location = await this.getLatestLocation(wardId);
        return {
          wardId,
          wardName: '', // Will be filled from calls data
          location,
          lastSeen: location?.timestamp,
        };
      } catch (error) {
        return {
          wardId,
          wardName: '',
          location: null,
        };
      }
    });

    return Promise.all(promises);
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

export interface WardLocation {
  wardId: string;
  wardName: string;
  location: Location | null;
  lastSeen?: string;
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

  async getWardsLocations(wardIds: string[]): Promise<WardLocation[]> {
    // Fetch locations for multiple wards in parallel
    const promises = wardIds.map(async (wardId) => {
      try {
        const location = await this.getLatestLocation(wardId);
        return {
          wardId,
          wardName: '', // Will be filled from calls data
          location,
          lastSeen: location?.timestamp,
        };
      } catch (error) {
        return {
          wardId,
          wardName: '',
          location: null,
        };
      }
    });

    return Promise.all(promises);
  },
};







