import { Test, TestingModule } from '@nestjs/testing';
import { DeviceRepository, Device } from '../device.repository';
import { getDatabaseConnection } from '../../../../shared/libs/database';

jest.mock('../../../../shared/libs/database', () => ({
  getDatabaseConnection: jest.fn(),
}));

describe('DeviceRepository', () => {
  let repository: DeviceRepository;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      query: jest.fn(),
    };

    (getDatabaseConnection as jest.Mock).mockReturnValue(mockDb);

    const module: TestingModule = await Test.createTestingModule({
      providers: [DeviceRepository],
    }).compile();

    repository = module.get<DeviceRepository>(DeviceRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new device', async () => {
      const deviceData = {
        userId: 'user-1',
        name: 'Test Device',
        deviceType: 'wearable',
        apiKey: 'test-api-key',
        firmwareVersion: '1.0.0',
        macAddress: '00:11:22:33:44:55',
      };

      const mockDevice: Device = {
        id: 'device-1',
        ...deviceData,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [mockDevice],
      });

      const result = await repository.create(deviceData);

      expect(result).toEqual(mockDevice);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO devices'),
        expect.arrayContaining([
          deviceData.userId,
          deviceData.name,
          deviceData.deviceType,
          deviceData.apiKey,
        ]),
      );
    });
  });

  describe('findById', () => {
    it('should find device by ID', async () => {
      const deviceId = 'device-1';
      const mockDevice: Device = {
        id: deviceId,
        userId: 'user-1',
        name: 'Test Device',
        deviceType: 'wearable',
        apiKey: 'test-api-key',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [mockDevice],
      });

      const result = await repository.findById(deviceId);

      expect(result).toEqual(mockDevice);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [deviceId],
      );
    });

    it('should return null if device not found', async () => {
      const deviceId = 'non-existent';

      mockDb.query.mockResolvedValueOnce({
        rows: [],
      });

      const result = await repository.findById(deviceId);

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find devices by user ID', async () => {
      const userId = 'user-1';
      const mockDevices: Device[] = [
        {
          id: 'device-1',
          userId,
          name: 'Device 1',
          deviceType: 'wearable',
          apiKey: 'key-1',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'device-2',
          userId,
          name: 'Device 2',
          deviceType: 'sensor',
          apiKey: 'key-2',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDb.query.mockResolvedValueOnce({
        rows: mockDevices,
      });

      const result = await repository.findByUserId(userId);

      expect(result).toEqual(mockDevices);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [userId],
      );
    });
  });

  describe('findByApiKey', () => {
    it('should find device by API key', async () => {
      const apiKey = 'test-api-key';
      const mockDevice: Device = {
        id: 'device-1',
        userId: 'user-1',
        name: 'Test Device',
        deviceType: 'wearable',
        apiKey,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [mockDevice],
      });

      const result = await repository.findByApiKey(apiKey);

      expect(result).toEqual(mockDevice);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [apiKey],
      );
    });
  });

  describe('update', () => {
    it('should update device', async () => {
      const deviceId = 'device-1';
      const updateData = {
        name: 'Updated Device Name',
        status: 'inactive',
      };

      const updatedDevice: Device = {
        id: deviceId,
        userId: 'user-1',
        name: updateData.name,
        deviceType: 'wearable',
        apiKey: 'test-api-key',
        status: updateData.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [updatedDevice],
      });

      const result = await repository.update(deviceId, updateData);

      expect(result).toEqual(updatedDevice);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE devices'),
        expect.arrayContaining([updateData.name, updateData.status, deviceId]),
      );
    });
  });

  describe('delete', () => {
    it('should delete device', async () => {
      const deviceId = 'device-1';

      mockDb.query.mockResolvedValueOnce({
        rowCount: 1,
      });

      await repository.delete(deviceId);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM devices'),
        [deviceId],
      );
    });
  });

  describe('linkToWard', () => {
    it('should link device to ward', async () => {
      const deviceId = 'device-1';
      const wardId = 'ward-1';

      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: deviceId, wardId }],
      });

      const result = await repository.linkToWard(deviceId, wardId);

      expect(result).toBeDefined();
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE devices'),
        [wardId, deviceId],
      );
    });
  });

  describe('unlinkFromWard', () => {
    it('should unlink device from ward', async () => {
      const deviceId = 'device-1';

      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: deviceId, wardId: null }],
      });

      const result = await repository.unlinkFromWard(deviceId);

      expect(result).toBeDefined();
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE devices'),
        [deviceId],
      );
    });
  });
});

