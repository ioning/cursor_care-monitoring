import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeviceService } from '../device.service';
import { DeviceRepository } from '../../../infrastructure/repositories/device.repository';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock('../../../../../../shared/libs/logger', () => ({
  createLogger: jest.fn(() => mockLogger),
}));

describe('DeviceService', () => {
  let deviceService: DeviceService;
  let deviceRepository: any;

  beforeEach(() => {
    deviceRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      linkToWard: jest.fn(),
      unlinkFromWard: jest.fn(),
    };

    deviceService = new DeviceService(deviceRepository);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new device successfully', async () => {
      const userId = 'user-1';
      const registerDto = {
        name: 'Test Device',
        deviceType: 'watch',
        macAddress: '00:11:22:33:44:55',
      };

      const deviceId = 'device-1';
      const apiKey = 'cms_test123';

      deviceRepository.create.mockResolvedValue({
        id: deviceId,
        userId,
        apiKey,
        ...registerDto,
        createdAt: new Date(),
      });

      const result = await deviceService.register(userId, registerDto);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(deviceId);
      expect(result.data.apiKey).toBeDefined();
      expect(result.data.apiKey).toMatch(/^cms_/);
      expect(deviceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          ...registerDto,
        }),
      );
    });
  });

  describe('getDevices', () => {
    it('should return all devices for user', async () => {
      const userId = 'user-1';
      const devices = [
        { id: 'device-1', userId, name: 'Device 1', apiKey: 'key1' },
        { id: 'device-2', userId, name: 'Device 2', apiKey: 'key2' },
      ];

      deviceRepository.findByUserId.mockResolvedValue(devices);

      const result = await deviceService.getDevices(userId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].apiKey).toBeUndefined();
      expect(result.data[1].apiKey).toBeUndefined();
    });

    it('should filter devices by wardId', async () => {
      const userId = 'user-1';
      const wardId = 'ward-1';

      deviceRepository.findByUserId.mockResolvedValue([]);

      await deviceService.getDevices(userId, wardId);

      expect(deviceRepository.findByUserId).toHaveBeenCalledWith(userId, wardId);
    });
  });

  describe('getDevice', () => {
    it('should return device by id', async () => {
      const userId = 'user-1';
      const deviceId = 'device-1';
      const device = {
        id: deviceId,
        userId,
        name: 'Test Device',
        apiKey: 'secret',
      };

      deviceRepository.findById.mockResolvedValue(device);

      const result = await deviceService.getDevice(userId, deviceId);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(deviceId);
      expect(result.data.apiKey).toBeUndefined();
    });

    it('should throw NotFoundException if device not found', async () => {
      deviceRepository.findById.mockResolvedValue(null);

      await expect(deviceService.getDevice('user-1', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own device', async () => {
      const device = {
        id: 'device-1',
        userId: 'other-user',
        name: 'Test Device',
      };

      deviceRepository.findById.mockResolvedValue(device);

      await expect(deviceService.getDevice('user-1', 'device-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateDevice', () => {
    it('should update device successfully', async () => {
      const userId = 'user-1';
      const deviceId = 'device-1';
      const updateDto = { name: 'Updated Name' };

      const device = { id: deviceId, userId, name: 'Old Name' };
      const updated = { ...device, ...updateDto };

      deviceRepository.findById.mockResolvedValue(device);
      deviceRepository.update.mockResolvedValue(updated);

      const result = await deviceService.updateDevice(userId, deviceId, updateDto);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(updateDto.name);
    });

    it('should throw NotFoundException if device not found', async () => {
      deviceRepository.findById.mockResolvedValue(null);

      await expect(
        deviceService.updateDevice('user-1', 'non-existent', { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own device', async () => {
      const device = { id: 'device-1', userId: 'other-user' };
      deviceRepository.findById.mockResolvedValue(device);

      await expect(
        deviceService.updateDevice('user-1', 'device-1', { name: 'New' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteDevice', () => {
    it('should delete device successfully', async () => {
      const userId = 'user-1';
      const deviceId = 'device-1';
      const device = { id: deviceId, userId };

      deviceRepository.findById.mockResolvedValue(device);
      deviceRepository.delete.mockResolvedValue(undefined);

      const result = await deviceService.deleteDevice(userId, deviceId);

      expect(result.success).toBe(true);
      expect(deviceRepository.delete).toHaveBeenCalledWith(deviceId);
    });

    it('should throw NotFoundException if device not found', async () => {
      deviceRepository.findById.mockResolvedValue(null);

      await expect(deviceService.deleteDevice('user-1', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('linkDevice', () => {
    it('should link device to ward successfully', async () => {
      const userId = 'user-1';
      const deviceId = 'device-1';
      const linkDto = { wardId: 'ward-1' };
      const device = { id: deviceId, userId };

      deviceRepository.findById.mockResolvedValue(device);
      deviceRepository.linkToWard.mockResolvedValue(undefined);

      const result = await deviceService.linkDevice(userId, deviceId, linkDto);

      expect(result.success).toBe(true);
      expect(deviceRepository.linkToWard).toHaveBeenCalledWith(deviceId, linkDto.wardId);
    });

    it('should throw NotFoundException if device not found', async () => {
      deviceRepository.findById.mockResolvedValue(null);

      await expect(
        deviceService.linkDevice('user-1', 'non-existent', { wardId: 'ward-1' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unlinkDevice', () => {
    it('should unlink device from ward successfully', async () => {
      const userId = 'user-1';
      const deviceId = 'device-1';
      const device = { id: deviceId, userId };

      deviceRepository.findById.mockResolvedValue(device);
      deviceRepository.unlinkFromWard.mockResolvedValue(undefined);

      const result = await deviceService.unlinkDevice(userId, deviceId);

      expect(result.success).toBe(true);
      expect(deviceRepository.unlinkFromWard).toHaveBeenCalledWith(deviceId);
    });
  });

  describe('getWardIdByDeviceIdInternal', () => {
    it('should return wardId for device', async () => {
      const deviceId = 'device-1';
      const device = { id: deviceId, wardId: 'ward-1' };

      deviceRepository.findById.mockResolvedValue(device);

      const result = await deviceService.getWardIdByDeviceIdInternal(deviceId);

      expect(result).toBe('ward-1');
    });

    it('should return null if device not found', async () => {
      deviceRepository.findById.mockResolvedValue(null);

      const result = await deviceService.getWardIdByDeviceIdInternal('non-existent');

      expect(result).toBeNull();
    });

    it('should return null if device has no wardId', async () => {
      const device = { id: 'device-1', wardId: null };
      deviceRepository.findById.mockResolvedValue(device);

      const result = await deviceService.getWardIdByDeviceIdInternal('device-1');

      expect(result).toBeNull();
    });
  });
});

