import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { store } from '../store';
import { addTelemetryData } from '../store/slices/telemetrySlice';
import { TelemetryService } from './TelemetryService';

class BluetoothService {
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private isInitialized = false;

  constructor() {
    this.manager = new BleManager();
  }

  async initialize() {
    if (this.isInitialized) return;

    this.manager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        this.isInitialized = true;
      }
    });
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

  async connectToDevice(deviceId: string): Promise<void> {
    try {
      const device = await this.manager.connectToDevice(deviceId);
      this.connectedDevice = device;

      await device.discoverAllServicesAndCharacteristics();

      // Subscribe to notifications
      const serviceUUID = '0000180d-0000-1000-8000-00805f9b34fb'; // Health Service
      const characteristicUUID = '00002a37-0000-1000-8000-00805f9b34fb'; // Heart Rate Measurement

      device.monitorCharacteristicForService(
        serviceUUID,
        characteristicUUID,
        (error, characteristic) => {
          if (error) {
            console.error('Characteristic monitoring error:', error);
            return;
          }

          if (characteristic?.value) {
            this.handleTelemetryData(characteristic.value);
          }
        }
      );
    } catch (error) {
      console.error('Connection error:', error);
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
      await this.connectedDevice.cancelConnection();
      this.connectedDevice = null;
    }
  }

  cleanup() {
    this.disconnect();
    this.manager.destroy();
    this.isInitialized = false;
  }
}

export const BluetoothService = new BluetoothService();

