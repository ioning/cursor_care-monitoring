import { Test, TestingModule } from '@nestjs/testing';
import { DeviceController } from '../device.controller';
import { DeviceService } from '../../application/services/device.service';
import { RegisterDeviceDto } from '../../dto/register-device.dto';
import { UpdateDeviceDto } from '../../dto/update-device.dto';
import { LinkDeviceDto } from '../../dto/link-device.dto';

describe('DeviceController', () => {
  let controller: DeviceController;
  let deviceService: any;

  beforeEach(async () => {
    deviceService = {
      register: jest.fn(),
      getDevices: jest.fn(),
      getDevice: jest.fn(),
      updateDevice: jest.fn(),
      deleteDevice: jest.fn(),
      linkDevice: jest.fn(),
      unlinkDevice: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceController],
      providers: [
        {
          provide: DeviceService,
          useValue: deviceService,
        },
      ],
    }).compile();

    controller = module.get<DeviceController>(DeviceController);
  });

  describe('register', () => {
    it('should register a new device', async () => {
      const userId = 'user-1';
      const registerDeviceDto: RegisterDeviceDto = {
        name: 'Test Device',
        type: 'wearable',
        macAddress: '00:11:22:33:44:55',
        firmwareVersion: '1.0.0',
      };

      const expectedResult = {
        success: true,
        data: {
          id: 'device-1',
          name: registerDeviceDto.name,
          type: registerDeviceDto.type,
        },
      };

      deviceService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(
        { user: { id: userId } } as any,
        registerDeviceDto,
      );

      expect(result).toEqual(expectedResult);
      expect(deviceService.register).toHaveBeenCalledWith(userId, registerDeviceDto);
    });
  });

  describe('getDevices', () => {
    it('should get all devices for user', async () => {
      const userId = 'user-1';
      const expectedResult = {
        success: true,
        data: [
          { id: 'device-1', name: 'Device 1' },
          { id: 'device-2', name: 'Device 2' },
        ],
      };

      deviceService.getDevices.mockResolvedValue(expectedResult);

      const result = await controller.getDevices({ user: { id: userId } } as any);

      expect(result).toEqual(expectedResult);
      expect(deviceService.getDevices).toHaveBeenCalledWith(userId, undefined);
    });

    it('should get devices filtered by wardId', async () => {
      const userId = 'user-1';
      const wardId = 'ward-1';
      const expectedResult = {
        success: true,
        data: [{ id: 'device-1', name: 'Device 1', wardId }],
      };

      deviceService.getDevices.mockResolvedValue(expectedResult);

      const result = await controller.getDevices({ user: { id: userId } } as any, wardId);

      expect(result).toEqual(expectedResult);
      expect(deviceService.getDevices).toHaveBeenCalledWith(userId, wardId);
    });
  });

  describe('getDevice', () => {
    it('should get device by ID', async () => {
      const userId = 'user-1';
      const deviceId = 'device-1';
      const expectedResult = {
        success: true,
        data: { id: deviceId, name: 'Test Device' },
      };

      deviceService.getDevice.mockResolvedValue(expectedResult);

      const result = await controller.getDevice({ user: { id: userId } } as any, deviceId);

      expect(result).toEqual(expectedResult);
      expect(deviceService.getDevice).toHaveBeenCalledWith(userId, deviceId);
    });
  });

  describe('updateDevice', () => {
    it('should update device', async () => {
      const userId = 'user-1';
      const deviceId = 'device-1';
      const updateDeviceDto: UpdateDeviceDto = {
        name: 'Updated Device Name',
      };

      const expectedResult = {
        success: true,
        data: { id: deviceId, name: updateDeviceDto.name },
      };

      deviceService.updateDevice.mockResolvedValue(expectedResult);

      const result = await controller.updateDevice(
        { user: { id: userId } } as any,
        deviceId,
        updateDeviceDto,
      );

      expect(result).toEqual(expectedResult);
      expect(deviceService.updateDevice).toHaveBeenCalledWith(userId, deviceId, updateDeviceDto);
    });
  });

  describe('deleteDevice', () => {
    it('should delete device', async () => {
      const userId = 'user-1';
      const deviceId = 'device-1';
      const expectedResult = {
        success: true,
        message: 'Device deleted successfully',
      };

      deviceService.deleteDevice.mockResolvedValue(expectedResult);

      const result = await controller.deleteDevice({ user: { id: userId } } as any, deviceId);

      expect(result).toEqual(expectedResult);
      expect(deviceService.deleteDevice).toHaveBeenCalledWith(userId, deviceId);
    });
  });

  describe('linkDevice', () => {
    it('should link device to ward', async () => {
      const userId = 'user-1';
      const deviceId = 'device-1';
      const linkDeviceDto: LinkDeviceDto = {
        wardId: 'ward-1',
      };

      const expectedResult = {
        success: true,
        message: 'Device linked successfully',
      };

      deviceService.linkDevice.mockResolvedValue(expectedResult);

      const result = await controller.linkDevice(
        { user: { id: userId } } as any,
        deviceId,
        linkDeviceDto,
      );

      expect(result).toEqual(expectedResult);
      expect(deviceService.linkDevice).toHaveBeenCalledWith(userId, deviceId, linkDeviceDto);
    });
  });

  describe('unlinkDevice', () => {
    it('should unlink device from ward', async () => {
      const userId = 'user-1';
      const deviceId = 'device-1';
      const expectedResult = {
        success: true,
        message: 'Device unlinked successfully',
      };

      deviceService.unlinkDevice.mockResolvedValue(expectedResult);

      const result = await controller.unlinkDevice({ user: { id: userId } } as any, deviceId);

      expect(result).toEqual(expectedResult);
      expect(deviceService.unlinkDevice).toHaveBeenCalledWith(userId, deviceId);
    });
  });
});

