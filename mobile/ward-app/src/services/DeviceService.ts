import { apiClient } from './ApiClient';
import { BluetoothService } from './BluetoothService';

export interface Device {
  id: string;
  name: string;
  deviceType: string;
  status: string;
  serialNumber?: string;
  macAddress?: string;
  lastSeenAt?: string;
}

export class DeviceService {
  static async getDevices(): Promise<Device[]> {
    const response = await apiClient.instance.get('/devices');
    // API Gateway возвращает { success: true, data: [...] }
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data || [];
  }

  /**
   * Connect to device by finding it via Bluetooth and connecting
   * @param device Device from API (with serialNumber)
   */
  static async connectDevice(device: Device): Promise<Device> {
    // Если есть серийный номер, ищем устройство через Bluetooth
    if (device.serialNumber) {
      try {
        // Сканируем Bluetooth устройства с этим серийным номером
        const bluetoothDevice = await BluetoothService.findDeviceBySerialNumber(device.serialNumber);
        
        if (bluetoothDevice) {
          // Подключаемся к Bluetooth устройству
          await BluetoothService.connectToDevice(bluetoothDevice.id);
          console.log('Connected to Bluetooth device:', bluetoothDevice.id);
        } else {
          console.warn('Bluetooth device not found for serial number:', device.serialNumber);
        }
      } catch (error) {
        console.error('Failed to connect via Bluetooth:', error);
        // Продолжаем, даже если Bluetooth подключение не удалось
      }
    }

    // Также вызываем API для подтверждения привязки (если нужно)
    try {
      const response = await apiClient.instance.post(`/devices/${device.id}/link`);
      return response.data?.data || device;
    } catch (error) {
      console.error('Failed to link device via API:', error);
      // Возвращаем устройство даже если API вызов не удался
      return device;
    }
  }

  /**
   * Auto-connect to all devices assigned to the ward
   */
  static async autoConnectDevices(): Promise<Device[]> {
    const devices = await this.getDevices();
    const connectedDevices: Device[] = [];

    for (const device of devices) {
      if (device.status === 'active' && device.serialNumber) {
        try {
          await this.connectDevice(device);
          connectedDevices.push(device);
        } catch (error) {
          console.error(`Failed to auto-connect device ${device.id}:`, error);
        }
      }
    }

    return connectedDevices;
  }
}

