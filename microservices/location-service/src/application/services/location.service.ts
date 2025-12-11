import { Injectable } from '@nestjs/common';
import { LocationRepository } from '../../infrastructure/repositories/location.repository';
import { GeofenceRepository } from '../../infrastructure/repositories/geofence.repository';
import { LocationEventPublisher } from '../../infrastructure/messaging/location-event.publisher';
import { YandexGeocoderService } from '../../infrastructure/services/geocoding/yandex-geocoder.service';
import { createLogger } from '../../../../shared/libs/logger';
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
    const geofences = await this.geofenceRepository.findByWardId(data.wardId);
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

  async getLatestLocation(wardId: string) {
    const location = await this.locationRepository.findLatest(wardId);
    
    // Если геолокация найдена, пытаемся получить адрес через геокодинг
    let address: string | null = null;
    if (location) {
      address = await this.geocodingService.reverseGeocode(
        location.latitude,
        location.longitude,
      );
    }

    return {
      success: true,
      data: location
        ? {
            ...location,
            address, // Добавляем адрес к данным геолокации
          }
        : null,
    };
  }

  async getLocationHistory(wardId: string, filters: any) {
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
    const geofence = await this.geofenceRepository.create({
      id: geofenceId,
      wardId,
      name: data.name,
      type: data.type,
      centerLatitude: data.centerLatitude,
      centerLongitude: data.centerLongitude,
      radius: data.radius,
      enabled: true,
    });

    return {
      success: true,
      data: geofence,
      message: 'Geofence created successfully',
    };
  }

  async getGeofences(wardId: string) {
    const geofences = await this.geofenceRepository.findByWardId(wardId);
    return {
      success: true,
      data: geofences,
    };
  }

  private isPointInGeofence(
    latitude: number,
    longitude: number,
    geofence: any,
  ): boolean {
    // Simple circle geofence check
    const distance = this.calculateDistance(
      latitude,
      longitude,
      geofence.centerLatitude,
      geofence.centerLongitude,
    );
    return distance <= geofence.radius;
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



