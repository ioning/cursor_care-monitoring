import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { store } from '../store';
import { addTelemetryData } from '../store/slices/telemetrySlice';
import { TelemetryService } from './TelemetryService';

interface BufferedMetric {
  metricType: string;
  value: number;
  unit: string;
  qualityScore?: number;
  timestamp: string;
}

class BluetoothServiceClass {
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private isInitialized = false;
  private reconnectAttempts: Map<string, number> = new Map();
  private reconnectIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 5000; // 5 seconds
  
  // Буферизация метрик для пакетной отправки
  private metricsBuffer: BufferedMetric[] = [];
  private bufferFlushInterval: NodeJS.Timeout | null = null;
  private readonly BUFFER_FLUSH_INTERVAL = 15000; // 15 секунд
  private readonly MAX_BUFFER_SIZE = 10; // Максимум метрик в буфере
  private characteristicMonitors: Map<string, any> = new Map(); // Для отслеживания подписок

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

  /**
   * Scan for Bluetooth devices
   * @param serialNumber Optional serial number to filter devices
   */
  async scanForDevices(serialNumber?: string): Promise<Device[]> {
    return new Promise((resolve, reject) => {
      const devices: Device[] = [];
      const seenDevices = new Set<string>(); // Для избежания дубликатов

      this.manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          this.manager.stopDeviceScan();
          reject(error);
          return;
        }

        if (device && !seenDevices.has(device.id)) {
          seenDevices.add(device.id);
          
          // Если указан серийный номер, проверяем его в различных полях
          if (serialNumber) {
            const deviceName = device.name || '';
            const deviceId = device.id || '';
            const manufacturerData = device.manufacturerData || '';
            const serviceData = device.serviceData || {};
            
            // Нормализуем серийный номер для сравнения (убираем пробелы, дефисы)
            const normalizedSerial = serialNumber.replace(/[\s-]/g, '').toUpperCase();
            
            // Проверяем в различных местах:
            // 1. В имени устройства (например, "CareMonitor-SN123456")
            // 2. В ID устройства (может содержать серийный номер)
            // 3. В manufacturer data (если устройство передает его)
            // 4. В service data (если устройство передает его)
            const nameMatch = deviceName.replace(/[\s-]/g, '').toUpperCase().includes(normalizedSerial);
            const idMatch = deviceId.replace(/[\s-]/g, '').toUpperCase().includes(normalizedSerial);
            const manufacturerMatch = manufacturerData.toString().replace(/[\s-]/g, '').toUpperCase().includes(normalizedSerial);
            const serviceDataMatch = Object.values(serviceData).some((data: any) => 
              data.toString().replace(/[\s-]/g, '').toUpperCase().includes(normalizedSerial)
            );
            
            if (nameMatch || idMatch || manufacturerMatch || serviceDataMatch) {
              devices.push(device);
            }
          } else {
            // Если серийный номер не указан, ищем устройства с именем CareMonitor
            if (device.name?.includes('CareMonitor')) {
              devices.push(device);
            }
          }
        }
      });

      // Stop scanning after 10 seconds
      setTimeout(() => {
        this.manager.stopDeviceScan();
        resolve(devices);
      }, 10000);
    });
  }

  /**
   * Scan and find device by serial number
   * @param serialNumber Serial number to search for
   */
  async findDeviceBySerialNumber(serialNumber: string): Promise<Device | null> {
    const devices = await this.scanForDevices(serialNumber);
    return devices.length > 0 ? devices[0] : null;
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

      // Инициализируем буфер и таймер для пакетной отправки
      this.startBufferFlushTimer();

      // Подписываемся на все доступные характеристики Health Service
      await this.subscribeToAllCharacteristics(device);
    } catch (error: any) {
      console.error('Connection error:', error);
      
      // Если это ошибка отключения, планируем переподключение
      if (error.message?.includes('disconnected') || error.message?.includes('timeout')) {
        this.scheduleReconnect(deviceId);
      }
      
      throw error;
    }
  }

  /**
   * Подписаться на все характеристики Health Service
   */
  private async subscribeToAllCharacteristics(device: Device) {
    try {
      const services = await device.services();
      
      // Определяем характеристики для мониторинга
      const characteristicsToMonitor = [
        { uuid: '00002a37-0000-1000-8000-00805f9b34fb', type: 'heart_rate', unit: 'bpm' }, // Heart Rate
        { uuid: '00002a19-0000-1000-8000-00805f9b34fb', type: 'battery', unit: '%' }, // Battery Level
        { uuid: '00002a6d-0000-1000-8000-00805f9b34fb', type: 'temperature', unit: 'c' }, // Temperature
        { uuid: '00002a53-0000-1000-8000-00805f9b34fb', type: 'steps', unit: 'count' }, // Steps
        { uuid: '00002a5f-0000-1000-8000-00805f9b34fb', type: 'spo2', unit: '%' }, // SpO2
      ];

      // Ищем Health Service (0x180D)
      const healthService = services.find(
        (s) => s.uuid.toLowerCase() === '0000180d-0000-1000-8000-00805f9b34fb'
      );

      if (!healthService) {
        console.warn('Health Service not found, subscribing to default Heart Rate');
        // Fallback: подписываемся на Heart Rate
        this.subscribeToCharacteristic(
          device,
          '0000180d-0000-1000-8000-00805f9b34fb',
          '00002a37-0000-1000-8000-00805f9b34fb',
          'heart_rate',
          'bpm'
        );
        return;
      }

      // Подписываемся на все доступные характеристики
      for (const charConfig of characteristicsToMonitor) {
        try {
          const characteristics = await healthService.characteristics();
          const characteristic = characteristics.find(
            (c) => c.uuid.toLowerCase() === charConfig.uuid.toLowerCase()
          );

          if (characteristic) {
            this.subscribeToCharacteristic(
              device,
              healthService.uuid,
              charConfig.uuid,
              charConfig.type,
              charConfig.unit
            );
          }
        } catch (error) {
          console.warn(`Failed to subscribe to ${charConfig.type}:`, error);
        }
      }

      // Подписываемся на акселерометр (если доступен)
      // Обычно это отдельный сервис
      try {
        const motionService = services.find(
          (s) => s.uuid.toLowerCase().includes('motion') || s.uuid.toLowerCase().includes('accelerometer')
        );
        if (motionService) {
          const characteristics = await motionService.characteristics();
          const accelChar = characteristics.find(
            (c) => c.uuid.toLowerCase().includes('accel') || c.uuid.toLowerCase().includes('motion')
          );
          if (accelChar) {
            this.subscribeToCharacteristic(
              device,
              motionService.uuid,
              accelChar.uuid,
              'accelerometer',
              'g'
            );
          }
        }
      } catch (error) {
        console.warn('Accelerometer service not available:', error);
      }
    } catch (error) {
      console.error('Failed to subscribe to characteristics:', error);
      // Fallback: подписываемся на Heart Rate
      this.subscribeToCharacteristic(
        device,
        '0000180d-0000-1000-8000-00805f9b34fb',
        '00002a37-0000-1000-8000-00805f9b34fb',
        'heart_rate',
        'bpm'
      );
    }
  }

  /**
   * Подписаться на конкретную характеристику
   */
  private subscribeToCharacteristic(
    device: Device,
    serviceUUID: string,
    characteristicUUID: string,
    metricType: string,
    defaultUnit: string
  ) {
    const monitorKey = `${serviceUUID}-${characteristicUUID}`;
    
    // Отменяем предыдущую подписку, если есть
    if (this.characteristicMonitors.has(monitorKey)) {
      return; // Уже подписаны
    }

    const monitor = device.monitorCharacteristicForService(
      serviceUUID,
      characteristicUUID,
      (error, characteristic) => {
        if (error) {
          console.error(`Characteristic monitoring error (${metricType}):`, error);
          if (error.message?.includes('disconnected')) {
            this.characteristicMonitors.delete(monitorKey);
            if (this.connectedDevice?.id === device.id) {
              this.scheduleReconnect(device.id);
            }
          }
          return;
        }

        if (characteristic?.value) {
          this.handleTelemetryData(characteristic.value, metricType, defaultUnit);
        }
      }
    );

    this.characteristicMonitors.set(monitorKey, monitor);
  }

  /**
   * Обработка данных телеметрии с поддержкой qualityScore
   */
  private handleTelemetryData(data: string, metricType?: string, defaultUnit?: string) {
    try {
      // Parse BLE data (format depends on device)
      let parsed: any;
      try {
        parsed = JSON.parse(data);
      } catch {
        // Если не JSON, пытаемся извлечь числовое значение
        const numericValue = parseFloat(data);
        if (!isNaN(numericValue)) {
          parsed = { value: numericValue };
        } else {
          console.warn('Unable to parse telemetry data:', data);
          return;
        }
      }

      // Определяем тип метрики
      const type = metricType || parsed.type || 'heart_rate';
      const unit = defaultUnit || parsed.unit || 'bpm';
      const value = parsed.value;
      
      if (value === undefined || value === null) {
        console.warn('Telemetry data missing value:', parsed);
        return;
      }

      // Вычисляем qualityScore на основе качества сигнала BLE
      // Можно использовать RSSI или другие параметры
      const qualityScore = parsed.qualityScore !== undefined 
        ? parsed.qualityScore 
        : this.calculateQualityScore(parsed.rssi, parsed.signalStrength);

      const telemetry: BufferedMetric = {
        metricType: type,
        value: typeof value === 'number' ? value : parseFloat(value),
        unit,
        qualityScore,
        timestamp: parsed.timestamp || new Date().toISOString(),
      };

      // Добавляем в Redux store для UI
      store.dispatch(addTelemetryData({
        metricType: telemetry.metricType,
        value: telemetry.value,
        unit: telemetry.unit,
        timestamp: telemetry.timestamp,
      }));

      // Добавляем в буфер для пакетной отправки
      this.addToBuffer(telemetry);
    } catch (error) {
      console.error('Failed to parse telemetry data:', error);
    }
  }

  /**
   * Вычисление qualityScore на основе качества сигнала
   */
  private calculateQualityScore(rssi?: number, signalStrength?: number): number {
    // Если есть RSSI, используем его для оценки качества
    if (rssi !== undefined) {
      // RSSI обычно от -100 до 0, где -100 = плохо, 0 = отлично
      // Нормализуем до 0-1
      const normalized = Math.max(0, Math.min(1, (rssi + 100) / 100));
      return Math.round(normalized * 100) / 100; // Округляем до 2 знаков
    }

    // Если есть signalStrength (0-100), используем его
    if (signalStrength !== undefined) {
      return Math.round((signalStrength / 100) * 100) / 100;
    }

    // По умолчанию считаем качество хорошим
    return 0.9;
  }

  /**
   * Добавить метрику в буфер
   */
  private addToBuffer(metric: BufferedMetric) {
    this.metricsBuffer.push(metric);

    // Если буфер заполнен, отправляем немедленно
    if (this.metricsBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.flushBuffer();
    }
  }

  /**
   * Запустить таймер для периодической отправки буфера
   */
  private startBufferFlushTimer() {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
    }

    this.bufferFlushInterval = setInterval(() => {
      this.flushBuffer();
    }, this.BUFFER_FLUSH_INTERVAL);
  }

  /**
   * Отправить буфер метрик пакетом
   */
  private flushBuffer() {
    if (this.metricsBuffer.length === 0 || !this.connectedDevice) {
      return;
    }

    const metricsToSend = [...this.metricsBuffer];
    this.metricsBuffer = [];

    // Отправляем пакетом через TelemetryService
    TelemetryService.sendTelemetryBatch({
      deviceId: this.connectedDevice.id,
      metrics: metricsToSend,
    }).catch((error) => {
      console.error('Failed to send telemetry batch:', error);
      // Возвращаем метрики в буфер при ошибке
      this.metricsBuffer.unshift(...metricsToSend);
    });
  }

  async disconnect() {
    // Отправляем оставшиеся метрики перед отключением
    this.flushBuffer();

    // Останавливаем таймер буфера
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
      this.bufferFlushInterval = null;
    }

    // Отменяем все подписки на характеристики
    this.characteristicMonitors.forEach((monitor) => {
      try {
        monitor.remove();
      } catch (error) {
        console.warn('Error removing characteristic monitor:', error);
      }
    });
    this.characteristicMonitors.clear();

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
    // Отправляем оставшиеся метрики
    this.flushBuffer();

    // Останавливаем таймер буфера
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
      this.bufferFlushInterval = null;
    }

    // Очищаем буфер
    this.metricsBuffer = [];

    // Очищаем все интервалы переподключения
    this.reconnectIntervals.forEach((interval) => clearTimeout(interval));
    this.reconnectIntervals.clear();
    this.reconnectAttempts.clear();

    // Отменяем все подписки
    this.characteristicMonitors.forEach((monitor) => {
      try {
        monitor.remove();
      } catch (error) {
        console.warn('Error removing characteristic monitor:', error);
      }
    });
    this.characteristicMonitors.clear();

    this.disconnect();
    this.manager.destroy();
    this.isInitialized = false;
  }
}

export const BluetoothService = new BluetoothServiceClass();

