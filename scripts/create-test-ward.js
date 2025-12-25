// Скрипт для создания тестового подопечного в кабинете тестового опекуна

const API_GATEWAY_URL = 'http://localhost:3000';
const GUARDIAN_EMAIL = 'guardian@care-monitoring.ru';
const GUARDIAN_PASSWORD = 'guardian123';

async function main() {
  console.log('=== Создание тестового подопечного ===\n');

  // Шаг 1: Логин опекуна
  console.log('1. Авторизация опекуна...');
  let token;
  try {
    const loginResponse = await fetch(`${API_GATEWAY_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: GUARDIAN_EMAIL,
        password: GUARDIAN_PASSWORD,
      }),
    });

    const loginData = await loginResponse.json();

    if (loginData.success && loginData.data.tokens) {
      token = loginData.data.tokens.accessToken;
      console.log('   ✓ Авторизация успешна');
      console.log(`   Опекун: ${loginData.data.user.fullName}`);
    } else {
      throw new Error('Неожиданный формат ответа от login');
    }
  } catch (error) {
    console.error('   ✗ Ошибка авторизации:', error.message);
    process.exit(1);
  }

  // Шаг 2: Создание подопечного
  console.log('\n2. Создание подопечного...');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const wardData = {
    fullName: `Тестовый Подопечный ${timestamp}`,
    phone: '+79001234567',
    dateOfBirth: '1950-01-15',
    gender: 'male',
    medicalInfo: 'Тестовый подопечный. Гипертония, требуется регулярный контроль давления.',
    emergencyContact: '+79009876543',
  };

  try {
    const createResponse = await fetch(`${API_GATEWAY_URL}/api/v1/users/wards`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wardData),
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      throw new Error(JSON.stringify(createData, null, 2));
    }

    if (createData.success) {
      console.log('   ✓ Подопечный создан успешно');
      console.log('\n=== Информация о подопечном ===');
      console.log(`   ID: ${createData.data.id}`);
      console.log(`   Имя: ${createData.data.fullName}`);
      console.log(`   Телефон: ${wardData.phone}`);
      if (createData.temporaryPassword) {
        console.log(`   Пароль для входа: ${createData.temporaryPassword}`);
        console.log('\n   ⚠ ВАЖНО: Сохраните этот пароль! Он отправлен подопечному по SMS.');
      }
      console.log('\n=== Следующие шаги ===');
      console.log('   - Подопечный появится в списке подопечных в кабинете опекуна');
      console.log('   - Подопечному отправлено SMS с данными для входа');
      console.log(`   - Телефон для входа: ${wardData.phone}`);
    } else {
      console.error('   ✗ Неожиданный формат ответа');
      console.error('   Ответ:', JSON.stringify(createData, null, 2));
    }
  } catch (error) {
    console.error('   ✗ Ошибка создания подопечного:', error.message);
    process.exit(1);
  }

  console.log('\n=== Готово ===');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

