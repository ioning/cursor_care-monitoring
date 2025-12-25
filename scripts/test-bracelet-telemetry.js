// Скрипт для отправки тестовых данных телеметрии от браслета
// Проверяет прохождение через все сервисы до фронта

const API_GATEWAY_URL = 'http://localhost:3000';
const DEVICE_ID = '11111111-1111-1111-1111-111111111111';
const WARD_ID = 'dac6bf83-aa52-42af-80ea-9ba5204e83b5';

// Учетные данные для логина
const ADMIN_EMAIL = 'admin@care-monitoring.ru';
const ADMIN_PASSWORD = '14081979';

let TOKEN = null;

async function main() {
  console.log('=== Тест отправки данных от браслета ===\n');

  // Шаг 1: Логин для получения токена
  console.log('1. Получение JWT токена...');
  try {
    const loginResponse = await fetch(`${API_GATEWAY_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    const loginData = await loginResponse.json();

    if (loginData.success && loginData.data.tokens) {
      TOKEN = loginData.data.tokens.accessToken;
      console.log('   ✓ Токен получен');
    } else {
      throw new Error('Неожиданный формат ответа от login');
    }
  } catch (error) {
    console.error('   ✗ Ошибка логина:', error.message);
    process.exit(1);
  }

  // Шаг 2: Проверка привязки устройства
  console.log('\n2. Проверка привязки устройства к подопечному...');
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    const devicesResponse = await fetch(`${API_GATEWAY_URL}/api/v1/devices`, {
      method: 'GET',
      headers,
    });

    const devicesData = await devicesResponse.json();

    let device = null;
    if (devicesData.success && devicesData.data) {
      device = devicesData.data.find((d) => d.id === DEVICE_ID);
    } else if (Array.isArray(devicesData)) {
      device = devicesData.find((d) => d.id === DEVICE_ID);
    }

    if (device) {
      console.log(`   ✓ Устройство найдено: ${device.name}`);
      if (device.wardId) {
        console.log(`   ✓ Устройство привязано к подопечному: ${device.wardId}`);
      } else {
        console.log('   ⚠ Устройство не привязано к подопечному, привязываю...');
        try {
          await fetch(`${API_GATEWAY_URL}/api/v1/devices/${DEVICE_ID}/link`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ wardId: WARD_ID }),
          });
          console.log('   ✓ Устройство привязано');
        } catch (error) {
          console.error('   ✗ Ошибка привязки:', error.message);
        }
      }
    } else {
      console.log('   ⚠ Устройство не найдено. Убедитесь, что seed выполнен: npm run db:seed');
    }
  } catch (error) {
    console.error('   ✗ Ошибка проверки устройства:', error.message);
  }

  // Шаг 3: Отправка тестовых данных телеметрии
  console.log('\n3. Отправка тестовых данных телеметрии...');

  const now = new Date().toISOString();
  const telemetryData = {
    deviceId: DEVICE_ID,
    metrics: [
      {
        type: 'heart_rate',
        value: 72,
        unit: 'bpm',
        qualityScore: 0.95,
        timestamp: now,
      },
      {
        type: 'spo2',
        value: 98,
        unit: '%',
        qualityScore: 0.92,
        timestamp: now,
      },
      {
        type: 'temperature',
        value: 36.6,
        unit: 'c',
        qualityScore: 0.97,
        timestamp: now,
      },
      {
        type: 'steps',
        value: 1250,
        unit: 'count',
        qualityScore: 0.9,
        timestamp: now,
      },
      {
        type: 'battery',
        value: 85,
        unit: '%',
        qualityScore: 1.0,
        timestamp: now,
      },
    ],
    location: {
      latitude: 55.7558,
      longitude: 37.6173,
      accuracy: 10,
      source: 'gps',
    },
  };

  try {
    const telemetryResponse = await fetch(`${API_GATEWAY_URL}/api/v1/telemetry`, {
      method: 'POST',
      headers,
      body: JSON.stringify(telemetryData),
    });

    const telemetryDataResponse = await telemetryResponse.json();

    if (!telemetryResponse.ok) {
      console.error('   ✗ Ошибка отправки телеметрии:', JSON.stringify(telemetryDataResponse, null, 2));
      process.exit(1);
    }

    console.log('   ✓ Данные отправлены успешно');
    if (telemetryDataResponse.data) {
      console.log(`   Telemetry ID: ${telemetryDataResponse.data.telemetryId}`);
      console.log(`   Ward ID: ${telemetryDataResponse.data.wardId}`);
      console.log(`   Metrics Count: ${telemetryDataResponse.data.metricsCount}`);
    }
  } catch (error) {
    console.error('   ✗ Ошибка отправки телеметрии:', error.message);
    process.exit(1);
  }

  // Шаг 4: Проверка получения данных через API
  console.log('\n4. Проверка получения данных через API...');

  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    // Проверка latest telemetry
    const latestResponse = await fetch(
      `${API_GATEWAY_URL}/api/v1/telemetry/wards/${WARD_ID}/latest`,
      {
        method: 'GET',
        headers,
      },
    );

    const latestData = await latestResponse.json();

    if (latestData.success && latestData.data?.metrics) {
      console.log('   ✓ Latest telemetry получен');
      console.log('   Метрики:');
      const metrics = latestData.data.metrics;
      Object.keys(metrics).forEach((key) => {
        const metric = metrics[key];
        console.log(`     - ${key}: ${metric.value} ${metric.unit || ''}`);
      });
    } else {
      console.log('   ⚠ Latest telemetry пуст или не найден');
    }
  } catch (error) {
    console.error('   ✗ Ошибка получения latest telemetry:', error.message);
  }

  try {
    // Проверка истории телеметрии
    const from = new Date(Date.now() - 3600000).toISOString();
    const to = new Date().toISOString();

    const url = new URL(`${API_GATEWAY_URL}/api/v1/telemetry/wards/${WARD_ID}`);
    url.searchParams.set('from', from);
    url.searchParams.set('to', to);
    url.searchParams.set('limit', '10');

    const historyResponse = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    const historyData = await historyResponse.json();

    if (historyData.success && historyData.data) {
      const count = Array.isArray(historyData.data) ? historyData.data.length : 0;
      console.log(`   ✓ История телеметрии получена: ${count} записей`);
    } else {
      console.log('   ⚠ История телеметрии пуста');
    }
  } catch (error) {
    console.error('   ✗ Ошибка получения истории:', error.message);
  }

  console.log('\n=== Тест завершен ===');
  console.log('\nПроверьте фронтенд приложение:');
  console.log('  - Откройте кабинет опекуна: http://localhost:5173');
  console.log(`  - Войдите как: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('  - Откройте детали подопечного');
  console.log('  - Проверьте раздел "Текущие показатели"');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

