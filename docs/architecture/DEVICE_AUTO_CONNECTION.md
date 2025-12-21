# Автоматическое подключение браслета по серийному номеру

## Обзор

Реализована система автоматического подключения браслета к мобильному приложению подопечного на основе серийного номера, указанного опекуном при регистрации устройства.

## Процесс работы

### Этап 1: Регистрация и привязка устройства (Веб-приложение опекуна)

1. **Опекун регистрирует устройство:**
   ```
   POST /api/v1/devices/register
   {
     "name": "Браслет Ивана",
     "deviceType": "bracelet",
     "serialNumber": "BR-2024-001234",  // ← Серийный номер
     "macAddress": "AA:BB:CC:DD:EE:FF"
   }
   ```

2. **Опекун привязывает устройство к подопечному:**
   ```
   POST /api/v1/devices/{deviceId}/link
   {
     "wardId": "<ward-id>"
   }
   ```

**Результат:**
- Устройство создано с `userId = guardian.id`
- Устройство привязано с `wardId = ward.id`
- Серийный номер сохранен в `devices.serial_number`

### Этап 2: Автоматическое подключение (Мобильное приложение подопечного)

1. **Подопечный открывает мобильное приложение:**
   - Входит в систему (логин/пароль из SMS)
   - Приложение автоматически загружает список устройств

2. **Приложение получает список устройств:**
   ```
   GET /api/v1/devices
   Authorization: Bearer <ward_token>
   ```
   
   **Результат:**
   ```json
   {
     "success": true,
     "data": [
       {
         "id": "device-uuid",
         "name": "Браслет Ивана",
         "deviceType": "bracelet",
         "serialNumber": "BR-2024-001234",  // ← Серийный номер
         "status": "active"
       }
     ]
   }
   ```

3. **Приложение автоматически сканирует Bluetooth:**
   - Для каждого устройства с серийным номером:
     - Сканирует Bluetooth устройства
     - Ищет устройство, содержащее серийный номер в:
       - Имени устройства (например, "CareMonitor-BR-2024-001234")
       - ID устройства
       - Manufacturer data
       - Service data

4. **Приложение автоматически подключается:**
   - Находит Bluetooth устройство с серийным номером
   - Подключается через Bluetooth LE
   - Начинает получать телеметрию

## Технические детали

### Backend изменения

#### 1. DeviceRepository.findByWardId()

```typescript
async findByWardId(wardId: string): Promise<Device[]> {
  const db = getDatabaseConnection();
  const result = await db.query(
    'SELECT * FROM devices WHERE ward_id = $1 ORDER BY created_at DESC',
    [wardId]
  );
  return result.rows.map((row) => this.mapRowToDevice(row));
}
```

#### 2. DeviceService.getDevices() - учет роли

```typescript
async getDevices(userId: string, userRole: string, wardId?: string) {
  let devices: Device[];
  
  if (userRole === 'ward') {
    // Для подопечного: ищем устройства, привязанные к нему
    devices = await this.deviceRepository.findByWardId(userId);
  } else {
    // Для опекуна: ищем устройства, которые он зарегистрировал
    devices = await this.deviceRepository.findByUserId(userId, wardId);
  }
  
  return {
    success: true,
    data: devices.map((d) => ({
      ...d,
      apiKey: undefined,
    })),
  };
}
```

#### 3. DeviceController - передача роли

```typescript
@Get()
async getDevices(@Request() req: any, @Query('wardId') wardId?: string) {
  return this.deviceService.getDevices(req.user.id, req.user.role, wardId);
}
```

### Mobile App изменения

#### 1. BluetoothService - поиск по серийному номеру

```typescript
async scanForDevices(serialNumber?: string): Promise<Device[]> {
  // Сканирует Bluetooth устройства
  // Если указан serialNumber, ищет устройство с этим номером
  // Проверяет в имени, ID, manufacturer data, service data
}

async findDeviceBySerialNumber(serialNumber: string): Promise<Device | null> {
  const devices = await this.scanForDevices(serialNumber);
  return devices.length > 0 ? devices[0] : null;
}
```

#### 2. DeviceService - автоматическое подключение

```typescript
static async connectDevice(device: Device): Promise<Device> {
  // Если есть серийный номер, ищем устройство через Bluetooth
  if (device.serialNumber) {
    const bluetoothDevice = await BluetoothService.findDeviceBySerialNumber(device.serialNumber);
    if (bluetoothDevice) {
      await BluetoothService.connectToDevice(bluetoothDevice.id);
    }
  }
  return device;
}

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
```

#### 3. DashboardScreen - автоматическое подключение при загрузке

```typescript
useEffect(() => {
  const loadAndConnect = async () => {
    await dispatch(fetchDevices()); // Получаем список устройств
    await dispatch(autoConnectDevices()); // Автоматически подключаемся
  };
  loadAndConnect();
}, [dispatch]);
```

## Поиск устройства по серийному номеру

### Где ищется серийный номер:

1. **Имя устройства (device.name):**
   - Формат: `CareMonitor-{serialNumber}`
   - Пример: `CareMonitor-BR-2024-001234`

2. **ID устройства (device.id):**
   - Может содержать серийный номер в MAC адресе или UUID

3. **Manufacturer Data:**
   - Производитель может передавать серийный номер в advertising data

4. **Service Data:**
   - Устройство может передавать серийный номер в service data

### Нормализация серийного номера:

При поиске серийный номер нормализуется:
- Убираются пробелы и дефисы
- Приводится к верхнему регистру
- Сравнивается с нормализованными значениями из Bluetooth устройства

**Пример:**
```
Серийный номер: "BR-2024-001234"
Нормализованный: "BR2024001234"

Имя устройства: "CareMonitor-BR-2024-001234"
Нормализованное: "CAREMONITORBR2024001234"
Совпадение: ✅ (содержит "BR2024001234")
```

## Поток данных

```
1. Опекун регистрирует устройство
   └─> devices.userId = guardian.id
   └─> devices.serialNumber = "BR-2024-001234"
   └─> devices.wardId = null

2. Опекун привязывает к подопечному
   └─> devices.wardId = ward.id
   └─> devices.serialNumber = "BR-2024-001234" (сохраняется)

3. Подопечный открывает мобильное приложение
   └─> GET /devices (с ward токеном)
   └─> ✅ Возвращает устройство с serialNumber

4. Приложение автоматически сканирует Bluetooth
   └─> BluetoothService.scanForDevices("BR-2024-001234")
   └─> Находит устройство "CareMonitor-BR-2024-001234"

5. Приложение автоматически подключается
   └─> BluetoothService.connectToDevice(bluetoothDeviceId)
   └─> Получает телеметрию через BLE
```

## Примеры использования

### Пример 1: Успешное автоматическое подключение

```typescript
// 1. Подопечный открывает приложение
// 2. Приложение загружает устройства
const devices = await DeviceService.getDevices();
// Результат: [{ id: "...", serialNumber: "BR-2024-001234", ... }]

// 3. Приложение автоматически подключается
const connected = await DeviceService.autoConnectDevices();
// Результат: [{ id: "...", serialNumber: "BR-2024-001234", ... }]

// 4. Bluetooth подключение установлено
// 5. Телеметрия начинает поступать
```

### Пример 2: Устройство не найдено

```typescript
// Если Bluetooth устройство не найдено:
// - Приложение логирует предупреждение
// - Продолжает работу без Bluetooth подключения
// - Подопечный может попробовать подключиться вручную позже
```

## Обработка ошибок

1. **Устройство не найдено в Bluetooth:**
   - Логируется предупреждение
   - Приложение продолжает работу
   - Подопечный может попробовать подключиться вручную

2. **Ошибка подключения:**
   - Логируется ошибка
   - Приложение продолжает работу
   - Автоматическое переподключение через BluetoothService

3. **Нет серийного номера:**
   - Устройство пропускается при автоматическом подключении
   - Подопечный может подключиться вручную

## Преимущества

1. ✅ **Автоматизация:** Подопечному не нужно вручную искать и подключать браслет
2. ✅ **Безопасность:** Подключение только к устройствам, привязанным опекуном
3. ✅ **Удобство:** Работает "из коробки" - открыл приложение и все подключилось
4. ✅ **Надежность:** Автоматическое переподключение при отключении

## Ограничения

1. ⚠️ **Bluetooth должен быть включен:** Приложение требует включенный Bluetooth
2. ⚠️ **Разрешения:** Требуются разрешения на Bluetooth и Location (для Android)
3. ⚠️ **Серийный номер должен совпадать:** Серийный номер в базе должен совпадать с тем, что передает браслет

## Будущие улучшения

1. ⏳ Поддержка нескольких устройств одновременно
2. ⏳ Приоритизация устройств (подключение к самому важному)
3. ⏳ Уведомления при успешном/неуспешном подключении
4. ⏳ Ручное подключение как fallback
5. ⏳ Кэширование последнего подключенного устройства

