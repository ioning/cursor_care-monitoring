import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { locationApi, type Location, type WardLocation } from '../api/location.api';

export const useLocationStore = defineStore('location', () => {
  const wardLocations = ref<Map<string, Location>>(new Map());
  const isLoading = ref(false);
  const trackingWards = ref<Set<string>>(new Set());
  const refreshIntervals = ref<Map<string, number>>(new Map());

  const getWardLocation = computed(() => (wardId: string): Location | null => {
    return wardLocations.value.get(wardId) || null;
  });

  async function fetchLatestLocation(wardId: string) {
    try {
      const location = await locationApi.getLatestLocation(wardId);
      if (location) {
        wardLocations.value.set(wardId, location);
      }
      return location;
    } catch (error) {
      console.error(`Failed to fetch location for ward ${wardId}:`, error);
      return null;
    }
  }

  async function fetchWardsLocations(wardIds: string[]) {
    isLoading.value = true;
    try {
      const locations = await locationApi.getWardsLocations(wardIds);
      locations.forEach((wardLocation) => {
        if (wardLocation.location) {
          wardLocations.value.set(wardLocation.wardId, wardLocation.location);
        }
      });
      return locations;
    } catch (error) {
      console.error('Failed to fetch wards locations:', error);
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchLocationHistory(
    wardId: string,
    filters?: {
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    },
  ) {
    try {
      const response = await locationApi.getLocationHistory(wardId, filters);
      return response;
    } catch (error) {
      console.error(`Failed to fetch location history for ward ${wardId}:`, error);
      throw error;
    }
  }

  function startTracking(wardId: string, intervalMs: number = 10000) {
    if (trackingWards.value.has(wardId)) {
      return; // Already tracking
    }

    trackingWards.value.add(wardId);

    // Fetch immediately
    fetchLatestLocation(wardId);

    // Set up interval
    const interval = window.setInterval(() => {
      fetchLatestLocation(wardId);
    }, intervalMs);

    refreshIntervals.value.set(wardId, interval);
  }

  function stopTracking(wardId: string) {
    if (!trackingWards.value.has(wardId)) {
      return;
    }

    trackingWards.value.delete(wardId);

    const interval = refreshIntervals.value.get(wardId);
    if (interval) {
      clearInterval(interval);
      refreshIntervals.value.delete(wardId);
    }
  }

  function stopAllTracking() {
    trackingWards.value.forEach((wardId) => {
      stopTracking(wardId);
    });
  }

  return {
    wardLocations,
    isLoading,
    trackingWards,
    getWardLocation,
    fetchLatestLocation,
    fetchWardsLocations,
    fetchLocationHistory,
    startTracking,
    stopTracking,
    stopAllTracking,
  };
});


import { ref, computed } from 'vue';
import { locationApi, type Location, type WardLocation } from '../api/location.api';

export const useLocationStore = defineStore('location', () => {
  const wardLocations = ref<Map<string, Location>>(new Map());
  const isLoading = ref(false);
  const trackingWards = ref<Set<string>>(new Set());
  const refreshIntervals = ref<Map<string, number>>(new Map());

  const getWardLocation = computed(() => (wardId: string): Location | null => {
    return wardLocations.value.get(wardId) || null;
  });

  async function fetchLatestLocation(wardId: string) {
    try {
      const location = await locationApi.getLatestLocation(wardId);
      if (location) {
        wardLocations.value.set(wardId, location);
      }
      return location;
    } catch (error) {
      console.error(`Failed to fetch location for ward ${wardId}:`, error);
      return null;
    }
  }

  async function fetchWardsLocations(wardIds: string[]) {
    isLoading.value = true;
    try {
      const locations = await locationApi.getWardsLocations(wardIds);
      locations.forEach((wardLocation) => {
        if (wardLocation.location) {
          wardLocations.value.set(wardLocation.wardId, wardLocation.location);
        }
      });
      return locations;
    } catch (error) {
      console.error('Failed to fetch wards locations:', error);
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchLocationHistory(
    wardId: string,
    filters?: {
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    },
  ) {
    try {
      const response = await locationApi.getLocationHistory(wardId, filters);
      return response;
    } catch (error) {
      console.error(`Failed to fetch location history for ward ${wardId}:`, error);
      throw error;
    }
  }

  function startTracking(wardId: string, intervalMs: number = 10000) {
    if (trackingWards.value.has(wardId)) {
      return; // Already tracking
    }

    trackingWards.value.add(wardId);

    // Fetch immediately
    fetchLatestLocation(wardId);

    // Set up interval
    const interval = window.setInterval(() => {
      fetchLatestLocation(wardId);
    }, intervalMs);

    refreshIntervals.value.set(wardId, interval);
  }

  function stopTracking(wardId: string) {
    if (!trackingWards.value.has(wardId)) {
      return;
    }

    trackingWards.value.delete(wardId);

    const interval = refreshIntervals.value.get(wardId);
    if (interval) {
      clearInterval(interval);
      refreshIntervals.value.delete(wardId);
    }
  }

  function stopAllTracking() {
    trackingWards.value.forEach((wardId) => {
      stopTracking(wardId);
    });
  }

  return {
    wardLocations,
    isLoading,
    trackingWards,
    getWardLocation,
    fetchLatestLocation,
    fetchWardsLocations,
    fetchLocationHistory,
    startTracking,
    stopTracking,
    stopAllTracking,
  };
});







