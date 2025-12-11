import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { store } from '../store';
import { addTelemetryData } from '../store/slices/telemetrySlice';
import { TelemetryService } from './TelemetryService';

class BluetoothService {
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private isInitialized = false;
  private reconnectAttempts: Map<string, number> = new Map();
  private reconnectIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 5000; // 5 seconds

  constructor() {
    this.manager = new BleManager();
  }

  async initialize() {
    if (this.isInitialized) return;

    this.manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        this.isInitialized = true;
        // Пытаемся переподключиться к последнему устройству
        if (this.connectedDevice) {
          this.reconnectToDevice(this.connectedDevice.id);
        }
      }
    });

    // Обработка отключений устройств
    this.manager.onDeviceDisconnected((deviceId, error) => {
      console.log(`Device ${deviceId} disconnected:`, error);
      if (this.connectedDevice?.id === deviceId) {
        this.connectedDevice = null;
        this.scheduleReconnect(deviceId);
      }
    });
  }

  /**
   * Запланировать переподключение к устройству
   */
  private scheduleReconnect(deviceId: string) {
    // Очищаем предыдущий интервал, если есть
    const existingInterval = this.reconnectIntervals.get(deviceId);
    if (existingInterval) {
      clearTimeout(existingInterval);
    }

    const attempts = this.reconnectAttempts.get(deviceId) || 0;
    if (attempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.warn(`Max reconnect attempts reached for device ${deviceId}`);
      this.reconnectAttempts.delete(deviceId);
      return;
    }

    const interval = setTimeout(() => {
      this.reconnectToDevice(deviceId);
    }, this.RECONNECT_DELAY * (attempts + 1)); // Exponential backoff

    this.reconnectIntervals.set(deviceId, interval);
  }

  /**
   * Переподключиться к устройству
   */
  private async reconnectToDevice(deviceId: string) {
    const attempts = this.reconnectAttempts.get(deviceId) || 0;
    this.reconnectAttempts.set(deviceId, attempts + 1);

    try {
      await this.connectToDevice(deviceId);
      // Успешное подключение - сбрасываем счетчик попыток
      this.reconnectAttempts.delete(deviceId);
      const interval = this.reconnectIntervals.get(deviceId);
      if (interval) {
        clearTimeout(interval);
        this.reconnectIntervals.delete(deviceId);
      }
    } catch (error) {
      console.error(`Reconnect attempt ${attempts + 1} failed:`, error);
      // Планируем следующую попытку
      this.scheduleReconnect(deviceId);
    }
  }

  async scanForDevices(): Promise<Device[]> {
    return new Promise((resolve, reject) => {
      const devices: Device[] = [];

      this.manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          this.manager.stopDeviceScan();
          reject(error);
          return;
        }

        if (device && device.name?.includes('CareMonitor')) {
          devices.push(device);
        }
      });

      // Stop scanning after 10 seconds
      setTimeout(() => {
        this.manager.stopDeviceScan();
        resolve(devices);
      }, 10000);
    });
  }

  async connectToDevice(deviceId: string, options?: { timeout?: number }): Promise<void> {
    try {
      // Отключаемся от предыдущего устройства, если есть
      if (this.connectedDevice && this.connectedDevice.id !== deviceId) {
        await this.disconnect();
      }

      const timeout = options?.timeout || 10000; // 10 seconds default
      const device = await Promise.race([
        this.manager.connectToDevice(deviceId),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), timeout)
        ),
      ]);

      this.connectedDevice = device;
      
      // Сбрасываем счетчик попыток переподключения
      this.reconnectAttempts.delete(deviceId);
      const interval = this.reconnectIntervals.get(deviceId);
      if (interval) {
        clearTimeout(interval);
        this.reconnectIntervals.delete(deviceId);
      }

      // Устанавливаем таймаут на обнаружение сервисов
      await Promise.race([
        device.discoverAllServicesAndCharacteristics(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Service discovery timeout')), timeout)
        ),
      ]);

      // Subscribe to notifications
      const serviceUUID = '0000180d-0000-1000-8000-00805f9b34fb'; // Health Service
      const characteristicUUID = '00002a37-0000-1000-8000-00805f9b34fb'; // Heart Rate Measurement

      device.monitorCharacteristicForService(
        serviceUUID,
        characteristicUUID,
        (error, characteristic) => {
          if (error) {
            console.error('Characteristic monitoring error:', error);
            // При ошибке мониторинга пытаемся переподключиться
            if (error.message?.includes('disconnected')) {
              this.scheduleReconnect(deviceId);
            }
            return;
          }

          if (characteristic?.value) {
            this.handleTelemetryData(characteristic.value);
          }
        }
      );
    } catch (error: any) {
      console.error('Connection error:', error);
      
      // Если это ошибка отключения, планируем переподключение
      if (error.message?.includes('disconnected') || error.message?.includes('timeout')) {
        this.scheduleReconnect(deviceId);
      }
      
      throw error;
    }
  }

  private handleTelemetryData(data: string) {
    try {
      // Parse BLE data (format depends on device)
      const parsed = JSON.parse(data);
      
      const telemetry = {
        metricType: parsed.type || 'heart_rate',
        value: parsed.value,
        unit: parsed.unit || 'bpm',
        timestamp: new Date().toISOString(),
      };

      store.dispatch(addTelemetryData(telemetry));

      // Send to API if device is linked
      if (this.connectedDevice) {
        TelemetryService.sendTelemetry({
          deviceId: this.connectedDevice.id,
          ...telemetry,
        }).catch((error) => {
          console.error('Failed to send telemetry:', error);
        });
      }
    } catch (error) {
      console.error('Failed to parse telemetry data:', error);
    }
  }

  async disconnect() {
    if (this.connectedDevice) {
      const deviceId = this.connectedDevice.id;
      try {
        await this.connectedDevice.cancelConnection();
      } catch (error) {
        console.error('Error disconnecting device:', error);
      } finally {
        this.connectedDevice = null;
        // Очищаем интервалы переподключения
        const interval = this.reconnectIntervals.get(deviceId);
        if (interval) {
          clearTimeout(interval);
          this.reconnectIntervals.delete(deviceId);
        }
        this.reconnectAttempts.delete(deviceId);
      }
    }
  }

  /**
   * Получить статус подключения
   */
  getConnectionStatus(): { connected: boolean; deviceId?: string } {
    return {
      connected: this.connectedDevice !== null,
      deviceId: this.connectedDevice?.id,
    };
  }

  /**
   * Получить информацию об устройстве
   */
  async getDeviceInfo(): Promise<{ name?: string; id: string; services?: any[] } | null> {
    if (!this.connectedDevice) return null;

    try {
      const services = await this.connectedDevice.services();
      return {
        name: this.connectedDevice.name || undefined,
        id: this.connectedDevice.id,
        services: services.map((s) => ({
          uuid: s.uuid,
          characteristics: [], // Можно расширить при необходимости
        })),
      };
    } catch (error) {
      console.error('Failed to get device info:', error);
      return {
        name: this.connectedDevice.name || undefined,
        id: this.connectedDevice.id,
      };
    }
  }

  cleanup() {
    // Очищаем все интервалы переподключения
    this.reconnectIntervals.forEach((interval) => clearTimeout(interval));
    this.reconnectIntervals.clear();
    this.reconnectAttempts.clear();

    this.disconnect();
    this.manager.destroy();
    this.isInitialized = false;
  }
}

export const BluetoothService = new BluetoothService();

