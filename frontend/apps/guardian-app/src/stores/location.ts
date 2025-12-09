import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { locationApi, type Location, type Geofence } from '../api/location.api';

export const useLocationStore = defineStore('location', () => {
  const locations = ref<Map<string, Location>>(new Map());
  const geofences = ref<Map<string, Geofence[]>>(new Map());
  const isLoading = ref(false);
  const trackingWards = ref<Set<string>>(new Set());
  const refreshIntervals = ref<Map<string, number>>(new Map());

  const getWardLocation = computed(() => (wardId: string): Location | null => {
    return locations.value.get(wardId) || null;
  });

  const getWardGeofences = computed(() => (wardId: string): Geofence[] => {
    return geofences.value.get(wardId) || [];
  });

  async function fetchLatestLocation(wardId: string) {
    isLoading.value = true;
    try {
      const location = await locationApi.getLatestLocation(wardId);
      if (location) {
        locations.value.set(wardId, location);
      }
      return location;
    } catch (error) {
      console.error(`Failed to fetch location for ward ${wardId}:`, error);
      return null;
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
    isLoading.value = true;
    try {
      const response = await locationApi.getLocationHistory(wardId, filters);
      return response;
    } catch (error) {
      console.error(`Failed to fetch location history for ward ${wardId}:`, error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchGeofences(wardId: string) {
    try {
      const geofencesList = await locationApi.getGeofences(wardId);
      geofences.value.set(wardId, geofencesList);
      return geofencesList;
    } catch (error) {
      console.error(`Failed to fetch geofences for ward ${wardId}:`, error);
      return [];
    }
  }

  async function createGeofence(wardId: string, data: {
    name: string;
    type: 'safe_zone' | 'restricted_zone';
    centerLatitude: number;
    centerLongitude: number;
    radius: number;
  }) {
    try {
      const geofence = await locationApi.createGeofence(wardId, data);
      const currentGeofences = geofences.value.get(wardId) || [];
      geofences.value.set(wardId, [...currentGeofences, geofence]);
      return geofence;
    } catch (error) {
      console.error(`Failed to create geofence for ward ${wardId}:`, error);
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
    locations,
    geofences,
    isLoading,
    trackingWards,
    getWardLocation,
    getWardGeofences,
    fetchLatestLocation,
    fetchLocationHistory,
    fetchGeofences,
    createGeofence,
    startTracking,
    stopTracking,
    stopAllTracking,
  };
});


import { ref, computed } from 'vue';
import { locationApi, type Location, type Geofence } from '../api/location.api';

export const useLocationStore = defineStore('location', () => {
  const locations = ref<Map<string, Location>>(new Map());
  const geofences = ref<Map<string, Geofence[]>>(new Map());
  const isLoading = ref(false);
  const trackingWards = ref<Set<string>>(new Set());
  const refreshIntervals = ref<Map<string, number>>(new Map());

  const getWardLocation = computed(() => (wardId: string): Location | null => {
    return locations.value.get(wardId) || null;
  });

  const getWardGeofences = computed(() => (wardId: string): Geofence[] => {
    return geofences.value.get(wardId) || [];
  });

  async function fetchLatestLocation(wardId: string) {
    isLoading.value = true;
    try {
      const location = await locationApi.getLatestLocation(wardId);
      if (location) {
        locations.value.set(wardId, location);
      }
      return location;
    } catch (error) {
      console.error(`Failed to fetch location for ward ${wardId}:`, error);
      return null;
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
    isLoading.value = true;
    try {
      const response = await locationApi.getLocationHistory(wardId, filters);
      return response;
    } catch (error) {
      console.error(`Failed to fetch location history for ward ${wardId}:`, error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchGeofences(wardId: string) {
    try {
      const geofencesList = await locationApi.getGeofences(wardId);
      geofences.value.set(wardId, geofencesList);
      return geofencesList;
    } catch (error) {
      console.error(`Failed to fetch geofences for ward ${wardId}:`, error);
      return [];
    }
  }

  async function createGeofence(wardId: string, data: {
    name: string;
    type: 'safe_zone' | 'restricted_zone';
    centerLatitude: number;
    centerLongitude: number;
    radius: number;
  }) {
    try {
      const geofence = await locationApi.createGeofence(wardId, data);
      const currentGeofences = geofences.value.get(wardId) || [];
      geofences.value.set(wardId, [...currentGeofences, geofence]);
      return geofence;
    } catch (error) {
      console.error(`Failed to create geofence for ward ${wardId}:`, error);
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
    locations,
    geofences,
    isLoading,
    trackingWards,
    getWardLocation,
    getWardGeofences,
    fetchLatestLocation,
    fetchLocationHistory,
    fetchGeofences,
    createGeofence,
    startTracking,
    stopTracking,
    stopAllTracking,
  };
});







