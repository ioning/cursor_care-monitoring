import { LocationService, LocationData } from '../location.service';
import { LocationRepository } from '../../../infrastructure/repositories/location.repository';
import { GeofenceRepository } from '../../../infrastructure/repositories/geofence.repository';
import { LocationEventPublisher } from '../../../infrastructure/messaging/location-event.publisher';
import { YandexGeocoderService } from '../../../infrastructure/services/geocoding/yandex-geocoder.service';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock('../../../../../../shared/libs/logger', () => ({
  createLogger: jest.fn(() => mockLogger),
}));

describe('LocationService', () => {
  let locationService: LocationService;
  let locationRepository: any;
  let geofenceRepository: any;
  let eventPublisher: any;
  let geocodingService: any;

  beforeEach(() => {
    locationRepository = {
      create: jest.fn(),
      findByWardId: jest.fn(),
      findLatest: jest.fn(),
    };

    geofenceRepository = {
      findByWardId: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    eventPublisher = {
      publishLocationRecorded: jest.fn(),
      publishGeofenceViolation: jest.fn(),
    };

    geocodingService = {
      reverseGeocode: jest.fn(),
    };

    locationService = new LocationService(
      locationRepository,
      geofenceRepository,
      eventPublisher,
      geocodingService,
    );
    jest.clearAllMocks();
  });

  describe('recordLocation', () => {
    it('should record location successfully', async () => {
      const locationData: LocationData = {
        wardId: 'ward-1',
        latitude: 55.7558,
        longitude: 37.6173,
        source: 'gps',
      };

      geofenceRepository.findByWardId.mockResolvedValue([]);
      locationRepository.create.mockResolvedValue({ id: 'loc-1', ...locationData });

      await locationService.recordLocation(locationData);

      expect(locationRepository.create).toHaveBeenCalled();
      expect(eventPublisher.publishLocationRecorded).toHaveBeenCalled();
    });

    it('should check geofences and publish violation if outside', async () => {
      const locationData: LocationData = {
        wardId: 'ward-1',
        latitude: 55.7558,
        longitude: 37.6173,
        source: 'gps',
      };

      const geofence = {
        id: 'geofence-1',
        wardId: 'ward-1',
        latitude: 55.7500,
        longitude: 37.6000,
        radius: 1000, // 1km
      };

      geofenceRepository.findByWardId.mockResolvedValue([geofence]);
      locationRepository.create.mockResolvedValue({ id: 'loc-1', ...locationData });

      await locationService.recordLocation(locationData);

      expect(eventPublisher.publishGeofenceViolation).toHaveBeenCalled();
    });
  });

  describe('getLocationHistory', () => {
    it('should return location history for ward', async () => {
      const wardId = 'ward-1';
      const locations = [
        { id: 'loc-1', wardId, latitude: 55.7558, longitude: 37.6173 },
        { id: 'loc-2', wardId, latitude: 55.7560, longitude: 37.6175 },
      ];

      locationRepository.findByWardId.mockResolvedValue(locations);

      const result = await locationService.getLocationHistory(wardId, {
        from: '2024-01-01',
        to: '2024-01-02',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(locations);
    });
  });

  describe('getCurrentLocation', () => {
    it('should return current location for ward', async () => {
      const wardId = 'ward-1';
      const location = {
        id: 'loc-1',
        wardId,
        latitude: 55.7558,
        longitude: 37.6173,
        timestamp: new Date(),
      };

      locationRepository.findLatest.mockResolvedValue(location);

      const result = await locationService.getCurrentLocation(wardId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(location);
    });
  });

  describe('createGeofence', () => {
    it('should create geofence successfully', async () => {
      const wardId = 'ward-1';
      const geofenceDto = {
        name: 'Home',
        latitude: 55.7558,
        longitude: 37.6173,
        radius: 1000,
      };

      const geofence = {
        id: 'geofence-1',
        wardId,
        ...geofenceDto,
      };

      geofenceRepository.create.mockResolvedValue(geofence);

      const result = await locationService.createGeofence(wardId, geofenceDto);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(geofence);
    });
  });

  describe('getGeofences', () => {
    it('should return geofences for ward', async () => {
      const wardId = 'ward-1';
      const geofences = [
        { id: 'geofence-1', wardId, name: 'Home', latitude: 55.7558, longitude: 37.6173 },
        { id: 'geofence-2', wardId, name: 'Work', latitude: 55.7500, longitude: 37.6000 },
      ];

      geofenceRepository.findByWardId.mockResolvedValue(geofences);

      const result = await locationService.getGeofences(wardId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(geofences);
    });
  });

  describe('deleteGeofence', () => {
    it('should delete geofence successfully', async () => {
      const geofenceId = 'geofence-1';

      geofenceRepository.delete.mockResolvedValue(undefined);

      const result = await locationService.deleteGeofence(geofenceId);

      expect(result.success).toBe(true);
      expect(geofenceRepository.delete).toHaveBeenCalledWith(geofenceId);
    });
  });
});

