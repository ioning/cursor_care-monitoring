import { apiClient } from './ApiClient';
import { LocationService as GeolocationService } from './LocationService';
import { NotificationService } from './NotificationService';

export interface Geofence {
  id: string;
  wardId: string;
  name: string;
  type: 'circle' | 'polygon';
  center?: {
    latitude: number;
    longitude: number;
    radius: number; // в метрах
  };
  polygon?: Array<{ latitude: number; longitude: number }>;
  enabled: boolean;
  createdAt: string;
}

export interface GeofenceViolation {
  id: string;
  geofenceId: string;
  wardId: string;
  violationType: 'enter' | 'exit';
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

class GeofenceService {
  private monitoredGeofences: Map<string, Geofence> = new Map();
  private lastLocations: Map<string, { latitude: number; longitude: number }> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Инициализация сервиса геозон
   */
  async initialize(wardId: string) {
    await this.loadGeofences(wardId);
    this.startMonitoring();
  }

  /**
   * Загрузить геозоны для подопечного
   */
  async loadGeofences(wardId: string): Promise<Geofence[]> {
    try {
      const response = await apiClient.instance.get(`/locations/geofences`, {
        params: { wardId, enabled: true },
      });

      const geofences = response.data.data || response.data || [];
      
      // Сохраняем для мониторинга
      geofences.forEach((geofence: Geofence) => {
        this.monitoredGeofences.set(geofence.id, geofence);
      });

      return geofences;
    } catch (error) {
      console.error('Failed to load geofences:', error);
      return [];
    }
  }

  /**
   * Создать геозону
   */
  async createGeofence(wardId: string, geofenceData: Omit<Geofence, 'id' | 'createdAt'>): Promise<Geofence> {
    try {
      const response = await apiClient.instance.post('/locations/geofences', {
        ...geofenceData,
        wardId,
      });

      const geofence = response.data.data || response.data;
      this.monitoredGeofences.set(geofence.id, geofence);
      
      return geofence;
    } catch (error) {
      console.error('Failed to create geofence:', error);
      throw error;
    }
  }

  /**
   * Удалить геозону
   */
  async deleteGeofence(geofenceId: string): Promise<void> {
    try {
      await apiClient.instance.delete(`/locations/geofences/${geofenceId}`);
      this.monitoredGeofences.delete(geofenceId);
    } catch (error) {
      console.error('Failed to delete geofence:', error);
      throw error;
    }
  }

  /**
   * Начать мониторинг геозон
   */
  private startMonitoring() {
    if (this.checkInterval) return;

    // Проверяем местоположение каждые 30 секунд
    this.checkInterval = setInterval(() => {
      this.checkGeofences();
    }, 30000);
  }

  /**
   * Остановить мониторинг
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.monitoredGeofences.clear();
    this.lastLocations.clear();
  }

  /**
   * Проверить нарушение геозон
   */
  private async checkGeofences() {
    for (const [geofenceId, geofence] of this.monitoredGeofences.entries()) {
      if (!geofence.enabled) continue;

        try {
          // Получаем текущее местоположение
          const currentLocation = await GeolocationService.getCurrentPosition();
        if (!currentLocation) continue;

        const wasInside = this.lastLocations.has(geofenceId)
          ? this.isPointInGeofence(this.lastLocations.get(geofenceId)!, geofence)
          : false;

        const isInside = this.isPointInGeofence(
          { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
          geofence
        );

        // Сохраняем текущее местоположение
        this.lastLocations.set(geofenceId, {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });

        // Проверяем нарушение
        if (wasInside && !isInside) {
          // Выход из геозоны
          await this.handleViolation(geofence, 'exit', currentLocation);
        } else if (!wasInside && isInside) {
          // Вход в геозону
          await this.handleViolation(geofence, 'enter', currentLocation);
        }
      } catch (error) {
        console.error(`Failed to check geofence ${geofenceId}:`, error);
      }
    }
  }

  /**
   * Проверить, находится ли точка внутри геозоны
   */
  private isPointInGeofence(
    point: { latitude: number; longitude: number },
    geofence: Geofence
  ): boolean {
    if (geofence.type === 'circle' && geofence.center) {
      return this.isPointInCircle(point, geofence.center);
    } else if (geofence.type === 'polygon' && geofence.polygon) {
      return this.isPointInPolygon(point, geofence.polygon);
    }
    return false;
  }

  /**
   * Проверить, находится ли точка внутри круга
   */
  private isPointInCircle(
    point: { latitude: number; longitude: number },
    center: { latitude: number; longitude: number; radius: number }
  ): boolean {
    const distance = this.calculateDistance(point, center);
    return distance <= center.radius;
  }

  /**
   * Проверить, находится ли точка внутри полигона (упрощенная версия)
   */
  private isPointInPolygon(
    point: { latitude: number; longitude: number },
    polygon: Array<{ latitude: number; longitude: number }>
  ): boolean {
    // Используем алгоритм ray casting
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].longitude,
        yi = polygon[i].latitude;
      const xj = polygon[j].longitude,
        yj = polygon[j].latitude;

      const intersect =
        yi > point.latitude !== yj > point.latitude &&
        point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Вычислить расстояние между двумя точками (Haversine formula)
   */
  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371000; // Радиус Земли в метрах
    const dLat = this.toRad(point2.latitude - point1.latitude);
    const dLon = this.toRad(point2.longitude - point1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.latitude)) *
        Math.cos(this.toRad(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Обработать нарушение геозоны
   */
  private async handleViolation(
    geofence: Geofence,
    violationType: 'enter' | 'exit',
    location: { latitude: number; longitude: number }
  ) {
    try {
      // Отправляем нарушение на сервер
      const violation: GeofenceViolation = {
        id: `violation_${Date.now()}`,
        geofenceId: geofence.id,
        wardId: geofence.wardId,
        violationType,
        location,
        timestamp: new Date().toISOString(),
      };

      await apiClient.instance.post('/locations/geofences/violations', violation);

      // Показываем уведомление
      const message =
        violationType === 'exit'
          ? `Выход из зоны: ${geofence.name}`
          : `Вход в зону: ${geofence.name}`;

      NotificationService.showLocalNotification(
        'Нарушение геозоны',
        message,
        { type: 'geofence_violation', violation },
        'care-monitoring-alerts'
      );
    } catch (error) {
      console.error('Failed to handle geofence violation:', error);
    }
  }

  /**
   * Получить нарушения геозон
   */
  async getViolations(wardId: string, limit: number = 50): Promise<GeofenceViolation[]> {
    try {
      const response = await apiClient.instance.get('/locations/geofences/violations', {
        params: { wardId, limit },
      });

      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Failed to get violations:', error);
      return [];
    }
  }
}

export const GeofenceService = new GeofenceService();

