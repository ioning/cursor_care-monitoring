// Скрипт для тестирования API телеметрии
// Проверяет, что данные правильно возвращаются через API Gateway

const API_GATEWAY_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@care-monitoring.ru';
const ADMIN_PASSWORD = '14081979';

// ID подопечного из seed
const WARD_ID = '6db0aa86-db1d-46a6-adb0-817c3cd36262';

let TOKEN = null;

async function main() {
  console.log('=== Тест API телеметрии ===\n');

  // Шаг 1: Логин
  console.log('1. Авторизация...');
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
      console.log('   ✓ Авторизация успешна');
    } else {
      throw new Error('Неожиданный формат ответа от login');
    }
  } catch (error) {
    console.error('   ✗ Ошибка авторизации:', error.message);
    process.exit(1);
  }

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };

  // Шаг 2: Проверка latest telemetry
  console.log('\n2. Проверка latest telemetry...');
  try {
    const latestResponse = await fetch(
      `${API_GATEWAY_URL}/api/v1/telemetry/wards/${WARD_ID}/latest`,
      { method: 'GET', headers }
    );

    const latestData = await latestResponse.json();
    console.log('   Status:', latestResponse.status);
    console.log('   Response:', JSON.stringify(latestData, null, 2));

    if (latestData.success && latestData.data) {
      console.log('   ✓ Latest telemetry получен');
      if (latestData.data.metrics && Object.keys(latestData.data.metrics).length > 0) {
        console.log('   Метрики:');
        Object.entries(latestData.data.metrics).forEach(([key, metric]) => {
          console.log(`     - ${key}: ${metric.value} ${metric.unit || ''}`);
        });
      } else {
        console.log('   ⚠ Метрики пусты');
      }
    } else {
      console.log('   ⚠ Неожиданный формат ответа');
    }
  } catch (error) {
    console.error('   ✗ Ошибка получения latest telemetry:', error.message);
  }

  // Шаг 3: Проверка истории телеметрии
  console.log('\n3. Проверка истории телеметрии...');
  try {
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
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
    console.log('   Status:', historyResponse.status);
    console.log('   Response structure:', {
      success: historyData.success,
      hasData: !!historyData.data,
      dataIsArray: Array.isArray(historyData.data),
      dataLength: Array.isArray(historyData.data) ? historyData.data.length : 'N/A',
      hasMeta: !!historyData.meta,
    });

    if (historyData.success && historyData.data) {
      if (Array.isArray(historyData.data)) {
        console.log(`   ✓ История получена: ${historyData.data.length} записей`);
        if (historyData.data.length > 0) {
          console.log('   Первая запись:');
          const first = historyData.data[0];
          console.log('     - wardId:', first.wardId);
          console.log('     - timestamp:', first.timestamp);
          console.log('     - metrics keys:', Object.keys(first.metrics || {}));
          if (first.metrics) {
            Object.entries(first.metrics).forEach(([key, metric]) => {
              console.log(`       ${key}: ${metric.value} ${metric.unit || ''}`);
            });
          }
        }
      } else {
        console.log('   ⚠ Данные не являются массивом');
        console.log('   Тип данных:', typeof historyData.data);
      }
    } else {
      console.log('   ⚠ Неожиданный формат ответа');
      console.log('   Полный ответ:', JSON.stringify(historyData, null, 2));
    }
  } catch (error) {
    console.error('   ✗ Ошибка получения истории:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
  }

  // Шаг 4: Проверка прямого запроса к telemetry-service
  console.log('\n4. Проверка прямого запроса к telemetry-service...');
  try {
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const to = new Date().toISOString();

    const url = new URL('http://localhost:3004/telemetry/wards/' + WARD_ID);
    url.searchParams.set('from', from);
    url.searchParams.set('to', to);
    url.searchParams.set('limit', '10');

    const directResponse = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    const directData = await directResponse.json();
    console.log('   Status:', directResponse.status);
    console.log('   Response structure:', {
      success: directData.success,
      hasData: !!directData.data,
      dataIsArray: Array.isArray(directData.data),
      dataLength: Array.isArray(directData.data) ? directData.data.length : 'N/A',
    });

    if (directData.success && directData.data && Array.isArray(directData.data)) {
      console.log(`   ✓ Прямой запрос успешен: ${directData.data.length} записей`);
    } else {
      console.log('   ⚠ Прямой запрос вернул неожиданный формат');
      console.log('   Полный ответ:', JSON.stringify(directData, null, 2));
    }
  } catch (error) {
    console.error('   ✗ Ошибка прямого запроса:', error.message);
  }

  console.log('\n=== Тест завершен ===');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

