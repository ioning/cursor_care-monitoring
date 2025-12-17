import { Test, TestingModule } from '@nestjs/testing';
import { LocationController } from '../location.controller';
import { LocationService } from '../../application/services/location.service';

describe('LocationController', () => {
  let controller: LocationController;
  let locationService: any;

  beforeEach(async () => {
    locationService = {
      recordLocation: jest.fn(),
      getLatestLocation: jest.fn(),
      getLocationHistory: jest.fn(),
      createGeofence: jest.fn(),
      getGeofences: jest.fn(),
      reverseGeocode: jest.fn(),
      geocode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationController],
      providers: [
        {
          provide: LocationService,
          useValue: locationService,
        },
      ],
    }).compile();

    controller = module.get<LocationController>(LocationController);
  });

  describe('recordLocation', () => {
    it('should record location for ward', async () => {
      const wardId = 'ward-1';
      const organizationId = 'org-1';
      const body = {
        latitude: 55.7558,
        longitude: 37.6173,
        accuracy: 10,
        source: 'gps',
      };

      locationService.recordLocation.mockResolvedValue(undefined);

      const result = await controller.recordLocation(
        { user: { organizationId } } as any,
        wardId,
        body,
      );

      expect(result).toEqual({
        success: true,
        message: 'Location recorded successfully',
      });
      expect(locationService.recordLocation).toHaveBeenCalledWith({
        wardId,
        ...body,
        organizationId,
      });
    });
  });

  describe('getLatestLocation', () => {
    it('should get latest location for ward', async () => {
      const wardId = 'ward-1';
      const expectedResult = {
        success: true,
        data: {
          wardId,
          latitude: 55.7558,
          longitude: 37.6173,
          timestamp: new Date(),
        },
      };

      locationService.getLatestLocation.mockResolvedValue(expectedResult);

      const result = await controller.getLatestLocation(wardId);

      expect(result).toEqual(expectedResult);
      expect(locationService.getLatestLocation).toHaveBeenCalledWith(wardId);
    });
  });

  describe('getLocationHistory', () => {
    it('should get location history for ward', async () => {
      const wardId = 'ward-1';
      const query = { from: '2024-01-01', to: '2024-01-02' };
      const expectedResult = {
        success: true,
        data: [
          {
            wardId,
            latitude: 55.7558,
            longitude: 37.6173,
            timestamp: new Date(),
          },
        ],
      };

      locationService.getLocationHistory.mockResolvedValue(expectedResult);

      const result = await controller.getLocationHistory(wardId, query);

      expect(result).toEqual(expectedResult);
      expect(locationService.getLocationHistory).toHaveBeenCalledWith(wardId, query);
    });
  });

  describe('createGeofence', () => {
    it('should create geofence', async () => {
      const body = {
        wardId: 'ward-1',
        name: 'Home',
        latitude: 55.7558,
        longitude: 37.6173,
        radius: 100,
      };
      const expectedResult = {
        success: true,
        data: {
          id: 'geofence-1',
          ...body,
        },
      };

      locationService.createGeofence.mockResolvedValue(expectedResult);

      const result = await controller.createGeofence(body);

      expect(result).toEqual(expectedResult);
      expect(locationService.createGeofence).toHaveBeenCalledWith(body.wardId, body);
    });
  });

  describe('getGeofences', () => {
    it('should get geofences for ward', async () => {
      const wardId = 'ward-1';
      const expectedResult = {
        success: true,
        data: [
          {
            id: 'geofence-1',
            wardId,
            name: 'Home',
          },
        ],
      };

      locationService.getGeofences.mockResolvedValue(expectedResult);

      const result = await controller.getGeofences(wardId);

      expect(result).toEqual(expectedResult);
      expect(locationService.getGeofences).toHaveBeenCalledWith(wardId);
    });
  });

  describe('reverseGeocode', () => {
    it('should reverse geocode coordinates', async () => {
      const lat = '55.7558';
      const lon = '37.6173';
      const expectedResult = {
        success: true,
        data: {
          address: 'Moscow, Russia',
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        },
      };

      locationService.reverseGeocode.mockResolvedValue(expectedResult);

      const result = await controller.reverseGeocode(lat, lon);

      expect(result).toEqual(expectedResult);
      expect(locationService.reverseGeocode).toHaveBeenCalledWith(
        parseFloat(lat),
        parseFloat(lon),
      );
    });

    it('should return error for invalid coordinates', async () => {
      const lat = 'invalid';
      const lon = '37.6173';

      const result = await controller.reverseGeocode(lat, lon);

      expect(result).toEqual({
        success: false,
        error: 'Invalid coordinates. lat and lon must be valid numbers.',
      });
      expect(locationService.reverseGeocode).not.toHaveBeenCalled();
    });
  });

  describe('geocode', () => {
    it('should geocode address', async () => {
      const address = 'Moscow, Russia';
      const expectedResult = {
        success: true,
        data: {
          address,
          latitude: 55.7558,
          longitude: 37.6173,
        },
      };

      locationService.geocode.mockResolvedValue(expectedResult);

      const result = await controller.geocode(address);

      expect(result).toEqual(expectedResult);
      expect(locationService.geocode).toHaveBeenCalledWith(address.trim());
    });

    it('should return error for empty address', async () => {
      const address = '';

      const result = await controller.geocode(address);

      expect(result).toEqual({
        success: false,
        error: 'Address parameter is required.',
      });
      expect(locationService.geocode).not.toHaveBeenCalled();
    });
  });
});

