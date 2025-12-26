// Скрипт для тестирования доступа к телеметрии для разных ролей

const API_GATEWAY_URL = 'http://localhost:3000';
const WARD_ID = '6db0aa86-db1d-46a6-adb0-817c3cd36262';

const USERS = {
  admin: {
    email: 'admin@care-monitoring.ru',
    password: '14081979',
  },
  guardian: {
    email: 'guardian@care-monitoring.ru',
    password: 'guardian123',
  },
  dispatcher: {
    email: 'dispatcher@care-monitoring.ru',
    password: 'dispatcher123',
  },
};

async function testAccess(userKey, user) {
  console.log(`\n=== Тест доступа для ${userKey} (${user.email}) ===`);

  // Логин
  let token;
  try {
    const loginResponse = await fetch(`${API_GATEWAY_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
      }),
    });

    const loginData = await loginResponse.json();
    if (loginData.success && loginData.data.tokens) {
      token = loginData.data.tokens.accessToken;
      const userInfo = loginData.data.user;
      console.log(`   Роль: ${userInfo.role}`);
      console.log(`   ID: ${userInfo.id}`);
    } else {
      throw new Error('Неожиданный формат ответа от login');
    }
  } catch (error) {
    console.error(`   ✗ Ошибка авторизации: ${error.message}`);
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Проверка latest telemetry
  try {
    const latestResponse = await fetch(
      `${API_GATEWAY_URL}/api/v1/telemetry/wards/${WARD_ID}/latest`,
      { method: 'GET', headers }
    );

    const latestData = await latestResponse.json();
    console.log(`   Latest telemetry - Status: ${latestResponse.status}`);

    if (latestResponse.status === 200 && latestData.success) {
      console.log(`   ✓ Доступ разрешен`);
      if (latestData.data.metrics && Object.keys(latestData.data.metrics).length > 0) {
        console.log(`   Метрики: ${Object.keys(latestData.data.metrics).join(', ')}`);
      }
    } else if (latestResponse.status === 403) {
      console.log(`   ✗ Доступ запрещен: ${latestData.message || 'Forbidden'}`);
    } else {
      console.log(`   ⚠ Неожиданный ответ:`, JSON.stringify(latestData, null, 2));
    }
  } catch (error) {
    console.error(`   ✗ Ошибка: ${error.message}`);
  }
}

async function main() {
  console.log('=== Тест доступа к телеметрии для разных ролей ===');
  console.log(`Подопечный ID: ${WARD_ID}\n`);

  for (const [userKey, user] of Object.entries(USERS)) {
    await testAccess(userKey, user);
  }

  console.log('\n=== Тест завершен ===');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

