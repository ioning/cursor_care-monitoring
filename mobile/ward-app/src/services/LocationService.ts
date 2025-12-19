import Geolocation from '@react-native-community/geolocation';
import { Platform, PermissionsAndroid } from 'react-native';
import { LocationService as ApiLocationService } from './ApiLocationService';
import { store } from '../store';
import { setLocation, setError } from '../store/slices/locationSlice';

class LocationServiceClass {
  private watchId: number | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          store.dispatch(setError('Location permission denied'));
          return;
        }
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Location service initialization error:', error);
      store.dispatch(setError('Failed to initialize location service'));
    }
  }

  startTracking(wardId: string) {
    if (!this.isInitialized) {
      this.initialize();
    }

    this.watchId = Geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || undefined,
          timestamp: new Date().toISOString(),
        };

        store.dispatch(setLocation(location));

        // Send to API (с поддержкой офлайн режима)
        ApiLocationService.sendLocation(wardId, {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        }).catch((error) => {
          console.error('Failed to send location:', error);
          // В офлайн режиме данные будут сохранены и отправлены позже
        });
      },
      (error) => {
        console.error('Location error:', error);
        store.dispatch(setError(error.message));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        distanceFilter: 10, // Update every 10 meters
      }
    );
  }

  /**
   * Получить текущую позицию (одноразовый запрос)
   */
  async getCurrentPosition(): Promise<{ latitude: number; longitude: number } | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Failed to get current position:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
    });
  }

  stopTracking() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  cleanup() {
    this.stopTracking();
    this.isInitialized = false;
  }
}

export const LocationService = new LocationServiceClass();

