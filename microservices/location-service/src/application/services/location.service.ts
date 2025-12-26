import { Injectable, ForbiddenException } from '@nestjs/common';
import { LocationRepository } from '../../infrastructure/repositories/location.repository';
import { GeofenceRepository } from '../../infrastructure/repositories/geofence.repository';
import { LocationEventPublisher } from '../../infrastructure/messaging/location-event.publisher';
import { YandexGeocoderService } from '../../infrastructure/services/geocoding/yandex-geocoder.service';
import { UserServiceClient } from '../../infrastructure/clients/user-service.client';
import { createLogger } from '../../../../../shared/libs/logger';
import { randomUUID } from 'crypto';

export interface LocationData {
  wardId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: string;
  timestamp?: Date;
  organizationId?: string;
}

@Injectable()
export class LocationService {
  private readonly logger = createLogger({ serviceName: 'location-service' });

  constructor(
    private readonly locationRepository: LocationRepository,
    private readonly geofenceRepository: GeofenceRepository,
    private readonly eventPublisher: LocationEventPublisher,
    private readonly geocodingService: YandexGeocoderService,
    private readonly userServiceClient: UserServiceClient,
  ) {}

  async recordLocation(data: LocationData): Promise<void> {
    const locationId = randomUUID();

    await this.locationRepository.create({
      id: locationId,
      wardId: data.wardId,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      source: data.source,
      timestamp: data.timestamp || new Date(),
    });

    // Check geofences
    const geofences = await this.geofenceRepository.findByWardId(data.wardId, { enabled: true });
    for (const geofence of geofences) {
      const isInside = this.isPointInGeofence(
        data.latitude,
        data.longitude,
        geofence,
      );

      if (!isInside && geofence.type === 'safe_zone') {
        // Ward left safe zone - publish event
        this.logger.warn(`Ward ${data.wardId} left safe zone ${geofence.id}`);
        await this.eventPublisher.publishGeofenceViolation({
          eventId: randomUUID(),
          eventType: 'location.geofence.violation',
          timestamp: new Date().toISOString(),
          version: '1.0',
          correlationId: randomUUID(),
          source: 'location-service',
          wardId: data.wardId,
          geofenceId: geofence.id,
          geofenceType: geofence.type,
          location: {
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
          },
          violationType: 'exit',
        });
      }
    }

    this.logger.info(`Location recorded: ${locationId}`, {
      wardId: data.wardId,
      latitude: data.latitude,
      longitude: data.longitude,
    });
  }

  async getLatestLocation(wardId: string, userId?: string, userRole?: string) {
    // Check access if user info is provided
    if (userId && userRole) {
      // Normalize role to lowercase for comparison
      const normalizedRole = userRole.toLowerCase();
      // Admin, dispatcher have full access
      if (normalizedRole === 'admin' || normalizedRole === 'dispatcher') {
        this.logger.info(`Access granted for ${userRole} (${normalizedRole}) ${userId} to ward ${wardId}`);
      } else {
        const hasAccess = await this.userServiceClient.hasAccessToWard(userId, wardId, userRole);
        this.logger.info(`Access check for ${userRole} ${userId} to ward ${wardId}: ${hasAccess}`);
        if (!hasAccess) {
          throw new ForbiddenException('You do not have access to this ward\'s location data');
        }
      }
    }

    try {
      const location = await this.locationRepository.findLatest(wardId);
      
      // Если геолокация найдена, пытаемся получить адрес через геокодинг
      let address: string | null = null;
      if (location) {
        try {
          address = await this.geocodingService.reverseGeocode(
            location.latitude,
            location.longitude,
          );
        } catch (error: any) {
          // Игнорируем ошибки геокодинга - адрес не критичен
          this.logger.warn('Failed to get address via geocoding', {
            wardId,
            error: error?.message,
          });
        }
      }

      return {
        success: true,
        data: location
          ? {
              id: location.id,
              wardId: location.wardId,
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              source: location.source,
              timestamp: location.timestamp instanceof Date 
                ? location.timestamp.toISOString() 
                : location.timestamp,
              organizationId: location.organizationId,
              createdAt: location.createdAt instanceof Date
                ? location.createdAt.toISOString()
                : location.createdAt,
              address, // Добавляем адрес к данным геолокации
            }
          : null,
      };
    } catch (error: any) {
      this.logger.error('Failed to get latest location', {
        wardId,
        error: error?.message,
        stack: error?.stack,
      });
      throw error;
    }
  }

  async getLocationHistory(wardId: string, filters: any, userId?: string, userRole?: string) {
    // Check access if user info is provided
    if (userId && userRole) {
      // Normalize role to lowercase for comparison
      const normalizedRole = userRole.toLowerCase();
      // Admin, dispatcher have full access
      if (normalizedRole === 'admin' || normalizedRole === 'dispatcher') {
        this.logger.info(`Access granted for ${userRole} (${normalizedRole}) ${userId} to ward ${wardId}`);
      } else {
        const hasAccess = await this.userServiceClient.hasAccessToWard(userId, wardId, userRole);
        this.logger.info(`Access check for ${userRole} ${userId} to ward ${wardId}: ${hasAccess}`);
        if (!hasAccess) {
          throw new ForbiddenException('You do not have access to this ward\'s location data');
        }
      }
    }

    const { from, to, page = 1, limit = 100 } = filters;
    const [locations, total] = await this.locationRepository.findByWardId(
      wardId,
      { from, to },
      { page, limit },
    );

    return {
      success: true,
      data: locations,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createGeofence(wardId: string, data: any) {
    const geofenceId = randomUUID();
    const shape: 'circle' | 'polygon' = data.shape === 'polygon' ? 'polygon' : 'circle';
    const type: 'safe_zone' | 'restricted_zone' =
      data.type === 'restricted_zone' ? 'restricted_zone' : 'safe_zone';

    if (shape === 'circle') {
      const centerLatitude = Number(data.centerLatitude ?? data.center_latitude);
      const centerLongitude = Number(data.centerLongitude ?? data.center_longitude);
      const radius = Number(data.radius);

      if (!Number.isFinite(centerLatitude) || !Number.isFinite(centerLongitude) || !Number.isFinite(radius)) {
        return { success: false, error: 'Invalid circle geofence params' };
      }

      const geofence = await this.geofenceRepository.create({
        id: geofenceId,
        wardId,
        name: data.name,
        type,
        shape,
        centerLatitude,
        centerLongitude,
        radius,
        enabled: data.enabled ?? true,
      });

      return {
        success: true,
        data: geofence,
        message: 'Geofence created successfully',
      };
    }

    const polygonPoints = Array.isArray(data.polygonPoints) ? data.polygonPoints : data.polygon_points;
    if (!Array.isArray(polygonPoints) || polygonPoints.length < 3) {
      return { success: false, error: 'Polygon geofence requires 3+ points' };
    }

    const normalizedPoints = polygonPoints.map((p: any) => ({
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
    }));
    if (normalizedPoints.some((p: any) => !Number.isFinite(p.latitude) || !Number.isFinite(p.longitude))) {
      return { success: false, error: 'Invalid polygon points' };
    }

    const geofence = await this.geofenceRepository.create({
      id: geofenceId,
      wardId,
      name: data.name,
      type,
      shape,
      polygonPoints: normalizedPoints,
      enabled: data.enabled ?? true,
    });

    return {
      success: true,
      data: geofence,
      message: 'Geofence created successfully',
    };
  }

  async getGeofences(wardId: string, options?: { enabled?: boolean }) {
    const geofences = await this.geofenceRepository.findByWardId(wardId, options);
    return {
      success: true,
      data: geofences,
    };
  }

  async updateGeofence(geofenceId: string, patch: any) {
    const updated = await this.geofenceRepository.update(geofenceId, {
      name: patch.name,
      enabled: patch.enabled,
    });
    return { success: true, data: updated };
  }

  async deleteGeofence(geofenceId: string) {
    const ok = await this.geofenceRepository.delete(geofenceId);
    return { success: ok };
  }

  private isPointInGeofence(
    latitude: number,
    longitude: number,
    geofence: any,
  ): boolean {
    if ((geofence.shape || 'circle') === 'polygon') {
      const polygon = geofence.polygonPoints || geofence.polygon_points;
      if (!Array.isArray(polygon) || polygon.length < 3) return false;
      return this.isPointInPolygon({ latitude, longitude }, polygon);
    }

    if (
      !Number.isFinite(geofence.centerLatitude) ||
      !Number.isFinite(geofence.centerLongitude) ||
      !Number.isFinite(geofence.radius)
    ) {
      return false;
    }

    const distance = this.calculateDistance(latitude, longitude, geofence.centerLatitude, geofence.centerLongitude);
    return distance <= geofence.radius;
  }

  private isPointInPolygon(
    point: { latitude: number; longitude: number },
    polygon: Array<{ latitude: number; longitude: number }>,
  ): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].longitude;
      const yi = polygon[i].latitude;
      const xj = polygon[j].longitude;
      const yj = polygon[j].latitude;

      const intersect =
        yi > point.latitude !== yj > point.latitude &&
        point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    // Haversine formula
    const R = 6371000; // Earth radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Обратный геокодинг: преобразование координат в адрес
   */
  async reverseGeocode(lat: number, lon: number) {
    const address = await this.geocodingService.reverseGeocode(lat, lon);
    return {
      success: true,
      data: {
        latitude: lat,
        longitude: lon,
        address: address || null,
      },
    };
  }

  /**
   * Прямой геокодинг: преобразование адреса в координаты
   */
  async geocode(address: string) {
    const coordinates = await this.geocodingService.geocode(address);
    return {
      success: true,
      data: coordinates
        ? {
            address,
            latitude: coordinates.lat,
            longitude: coordinates.lon,
          }
        : null,
    };
  }
}



