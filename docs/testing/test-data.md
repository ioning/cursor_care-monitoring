# Тестовые данные и seed-скрипты

Документация по тестовым данным, seed-скриптам и мокам для разработки и тестирования.

## Seed данные для разработки

### Тарифные планы

**Файл**: `database/seeds/subscription-plans.sql`

```sql
-- Базовый план
INSERT INTO billing.subscription_plans (id, name, description, price_monthly, price_annual, currency, features, max_wards, smp_calls_included, status)
VALUES (
  'plan-basic',
  'Базовый',
  'Базовый мониторинг для одного подопечного',
  990.00,
  9900.00,
  'RUB',
  '{"sos_button": true, "fall_detection": true, "ai_analytics": false, "dispatcher_service": false}'::jsonb,
  1,
  0,
  'active'
);

-- Стандарт план
INSERT INTO billing.subscription_plans (id, name, description, price_monthly, price_annual, currency, features, max_wards, smp_calls_included, status)
VALUES (
  'plan-standard',
  'Стандарт',
  'Расширенный мониторинг для семьи',
  1990.00,
  19900.00,
  'RUB',
  '{"sos_button": true, "fall_detection": true, "ai_analytics": true, "dispatcher_service": true}'::jsonb,
  3,
  5,
  'active'
);

-- Забота+ план
INSERT INTO billing.subscription_plans (id, name, description, price_monthly, price_annual, currency, features, max_wards, smp_calls_included, status)
VALUES (
  'plan-care-plus',
  'Забота+',
  'Премиум мониторинг с расширенной аналитикой',
  2990.00,
  29900.00,
  'RUB',
  '{"sos_button": true, "fall_detection": true, "ai_analytics": true, "dispatcher_service": true, "personal_operator": true}'::jsonb,
  5,
  10,
  'active'
);

-- Все включено
INSERT INTO billing.subscription_plans (id, name, description, price_monthly, price_annual, currency, features, max_wards, smp_calls_included, status)
VALUES (
  'plan-all-inclusive',
  'Все включено',
  'Максимальная защита без ограничений',
  4990.00,
  49900.00,
  'RUB',
  '{"sos_button": true, "fall_detection": true, "ai_analytics": true, "dispatcher_service": true, "personal_operator": true, "ecg_monitoring": true}'::jsonb,
  NULL,
  NULL,
  'active'
);
```

### Тестовые пользователи

**Файл**: `database/seeds/test-users.sql`

```sql
-- Тестовый опекун
INSERT INTO auth.users (id, email, password_hash, phone, full_name, role, status, email_verified, created_at)
VALUES (
  'user-guardian-1',
  'guardian@test.com',
  '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K',
  '+79991234567',
  'Иванов Иван Иванович',
  'guardian',
  'active',
  true,
  NOW()
);

-- Тестовый подопечный (ward)
INSERT INTO auth.users (id, email, password_hash, phone, full_name, role, status, email_verified, created_at)
VALUES (
  'user-ward-1',
  'ward@test.com',
  '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K',
  '+79991234568',
  'Петров Петр Петрович',
  'ward',
  'active',
  true,
  NOW()
);

-- Тестовый диспетчер
INSERT INTO auth.users (id, email, password_hash, phone, full_name, role, status, email_verified, created_at)
VALUES (
  'user-dispatcher-1',
  'dispatcher@test.com',
  '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K',
  '+79991234569',
  'Сидоров Сидор Сидорович',
  'dispatcher',
  'active',
  true,
  NOW()
);

-- Тестовый администратор
INSERT INTO auth.users (id, email, password_hash, phone, full_name, role, status, email_verified, created_at)
VALUES (
  'user-admin-1',
  'admin@test.com',
  '$2b$10$rQ8K8K8K8K8K8K8K8K8K8O8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8K',
  '+79991234570',
  'Админов Админ Админович',
  'admin',
  'active',
  true,
  NOW()
);
```

**Пароль для всех тестовых пользователей**: `Test1234!`

### Профили подопечных

**Файл**: `database/seeds/test-wards.sql`

```sql
-- Профиль подопечного
INSERT INTO user_service.wards (id, date_of_birth, medical_conditions, medical_notes, blood_type, height_cm, weight_kg, emergency_instructions, created_at)
VALUES (
  'user-ward-1',
  '1945-05-15',
  '{"allergies": ["Пенициллин", "Пыльца"], "chronic_diseases": ["Гипертония", "Диабет 2 типа"], "medications": ["Метформин 500мг", "Лизиноприл 10мг"]}'::jsonb,
  'Требуется регулярный контроль сахара и давления',
  'A+',
  175,
  80,
  'При потере сознания вызвать скорую немедленно',
  NOW()
);

-- Связь опекун-подопечный
INSERT INTO user_service.guardian_ward_relationships (id, guardian_id, ward_id, relationship_type, permissions, is_primary, created_at)
VALUES (
  'rel-1',
  'user-guardian-1',
  'user-ward-1',
  'child',
  '{"view_health_data": true, "receive_alerts": true, "manage_settings": true}'::jsonb,
  true,
  NOW()
);
```

### Тестовые устройства

**Файл**: `database/seeds/test-devices.sql`

```sql
-- Модель устройства
INSERT INTO device_service.device_models (id, name, manufacturer, type, capabilities, firmware_version, created_at)
VALUES (
  'model-bracelet-v2',
  'Care Bracelet v2',
  'CareTech',
  'bracelet',
  '{"heart_rate": true, "spo2": true, "fall_detection": true, "steps": true, "temperature": true}'::jsonb,
  '1.2.3',
  NOW()
);

-- Тестовое устройство
INSERT INTO device_service.devices (id, device_model_id, serial_number, mac_address, status, battery_level, firmware_version, created_at, activated_at)
VALUES (
  'device-test-1',
  'model-bracelet-v2',
  'BR-2024-TEST001',
  'AA:BB:CC:DD:EE:FF',
  'active',
  85,
  '1.2.3',
  NOW(),
  NOW()
);

-- Привязка устройства к подопечному
INSERT INTO device_service.ward_devices (id, ward_id, device_id, assigned_at, is_active)
VALUES (
  'wd-1',
  'user-ward-1',
  'device-test-1',
  NOW(),
  true
);
```

### Тестовая телеметрия

**Файл**: `database/seeds/test-telemetry.sql`

```sql
-- Генерация тестовых данных телеметрии за последние 7 дней
DO $$
DECLARE
  i INTEGER;
  ts TIMESTAMPTZ;
  hr INTEGER;
  steps INTEGER;
  spo2 INTEGER;
BEGIN
  FOR i IN 1..1008 LOOP  -- 7 дней * 24 часа * 6 измерений в час
    ts := NOW() - INTERVAL '7 days' + (i * INTERVAL '10 minutes');
    hr := 65 + floor(random() * 20)::INTEGER;  -- Пульс 65-85
    steps := floor(random() * 100)::INTEGER;   -- Шаги 0-100 за 10 минут
    spo2 := 95 + floor(random() * 5)::INTEGER; -- SpO2 95-100
    
    INSERT INTO telemetry.raw_metrics (device_id, ward_id, metric_type, value, unit, quality_score, timestamp, created_at)
    VALUES 
      ('device-test-1', 'user-ward-1', 'heart_rate', hr, 'bpm', 0.95, ts, ts),
      ('device-test-1', 'user-ward-1', 'steps', steps, 'count', 1.0, ts, ts),
      ('device-test-1', 'user-ward-1', 'spo2', spo2, 'percent', 0.92, ts, ts);
  END LOOP;
END $$;
```

### Тестовые подписки

**Файл**: `database/seeds/test-subscriptions.sql`

```sql
-- Активная подписка для тестового опекуна
INSERT INTO billing.subscriptions (id, guardian_id, plan_id, status, current_period_start, current_period_end, created_at)
VALUES (
  'sub-test-1',
  'user-guardian-1',
  'plan-standard',
  'active',
  DATE_TRUNC('month', NOW()),
  DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
  NOW()
);

-- Тестовый платеж
INSERT INTO billing.payments (id, subscription_id, external_payment_id, amount, currency, status, payment_method, paid_at, created_at)
VALUES (
  'pay-test-1',
  'sub-test-1',
  'yoo-test-123',
  1990.00,
  'RUB',
  'completed',
  'yookassa',
  NOW(),
  NOW()
);
```

## Моки для внешних сервисов

### Мок платежной системы

**Файл**: `tests/mocks/payment-provider.mock.ts`

```typescript
export class MockPaymentProvider {
  async createPayment(amount: number, currency: string, metadata: any) {
    return {
      paymentId: `mock-payment-${Date.now()}`,
      paymentUrl: `https://mock-payment.example.com/pay/${Date.now()}`,
      status: 'pending'
    };
  }

  async verifyWebhook(body: any, signature: string): Promise<boolean> {
    return true; // Всегда валидно для тестов
  }

  async getPaymentStatus(paymentId: string) {
    return {
      status: 'succeeded',
      amount: 1990.00,
      currency: 'RUB'
    };
  }
}
```

### Мок SMS провайдера

**Файл**: `tests/mocks/sms-provider.mock.ts`

```typescript
export class MockSMSProvider {
  private sentMessages: Array<{to: string, message: string}> = [];

  async sendSMS(to: string, message: string): Promise<string> {
    this.sentMessages.push({ to, message });
    return `mock-sms-id-${Date.now()}`;
  }

  getSentMessages(): Array<{to: string, message: string}> {
    return this.sentMessages;
  }

  clear() {
    this.sentMessages = [];
  }
}
```

### Мок Email провайдера

**Файл**: `tests/mocks/email-provider.mock.ts`

```typescript
export class MockEmailProvider {
  private sentEmails: Array<{to: string, subject: string, body: string}> = [];

  async sendEmail(to: string, subject: string, body: string): Promise<string> {
    this.sentEmails.push({ to, subject, body });
    return `mock-email-id-${Date.now()}`;
  }

  getSentEmails(): Array<{to: string, subject: string, body: string}> {
    return this.sentEmails;
  }

  clear() {
    this.sentEmails = [];
  }
}
```

### Мок AI Prediction Service

**Файл**: `tests/mocks/ai-prediction.mock.ts`

```typescript
export class MockAIPredictionService {
  async predictFall(inputFeatures: any): Promise<any> {
    // Простая эвристика для тестов
    const riskScore = inputFeatures.acceleration?.magnitude > 2.5 ? 0.85 : 0.15;
    
    return {
      predictionType: 'fall_prediction',
      riskScore,
      confidence: 0.90,
      severity: riskScore > 0.7 ? 'high' : 'low',
      timeHorizon: '15-30 minutes'
    };
  }

  async predictHealthRisks(wardId: string, window: any): Promise<any> {
    return {
      risks: [
        {
          type: 'heart_rate_anomaly',
          score: 0.65,
          severity: 'medium'
        }
      ]
    };
  }
}
```

## Тестовые сценарии

### Сценарий 1: Полный цикл мониторинга

**Файл**: `tests/scenarios/full-monitoring-cycle.test.ts`

```typescript
describe('Full Monitoring Cycle', () => {
  it('should handle complete monitoring flow', async () => {
    // 1. Регистрация опекуна
    const guardian = await registerGuardian({
      email: 'test-guardian@example.com',
      password: 'Test1234!',
      fullName: 'Test Guardian'
    });

    // 2. Создание подопечного
    const ward = await createWard(guardian.token, {
      fullName: 'Test Ward',
      dateOfBirth: '1945-05-15'
    });

    // 3. Регистрация устройства
    const device = await registerDevice(guardian.token, {
      serialNumber: 'TEST-001',
      macAddress: 'AA:BB:CC:DD:EE:FF'
    });

    // 4. Привязка устройства
    await assignDevice(guardian.token, device.id, ward.id);

    // 5. Отправка телеметрии
    await sendTelemetry(ward.token, {
      deviceId: device.id,
      metrics: [
        { type: 'heart_rate', value: 72, unit: 'bpm' },
        { type: 'steps', value: 100, unit: 'count' }
      ]
    });

    // 6. Проверка получения данных опекуном
    const dashboard = await getDashboard(guardian.token);
    expect(dashboard.wards[0].latestMetrics.heartRate).toBe(72);
  });
});
```

### Сценарий 2: Обнаружение падения

**Файл**: `tests/scenarios/fall-detection.test.ts`

```typescript
describe('Fall Detection', () => {
  it('should detect fall and create alert', async () => {
    // 1. Отправка данных о падении
    await sendTelemetry(ward.token, {
      deviceId: device.id,
      metrics: [
        {
          type: 'fall_detection',
          value: 1,
          acceleration: { x: 0.1, y: 0.2, z: -2.8 }, // Высокое ускорение
          impactForce: 8.5
        },
        { type: 'heart_rate', value: 95, unit: 'bpm' }
      ]
    });

    // 2. Ожидание обработки AI
    await waitForEvent('ai.risk.alert', 5000);

    // 3. Проверка создания алерта
    const alerts = await getAlerts(guardian.token, { wardId: ward.id });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alertType).toBe('fall_detection');
    expect(alerts[0].severity).toBe('high');

    // 4. Проверка создания вызова диспетчеру
    const calls = await getCalls(dispatcher.token, { status: 'created' });
    expect(calls).toHaveLength(1);
    expect(calls[0].callType).toBe('fall_detection');
  });
});
```

## Скрипты для генерации тестовых данных

### Генератор телеметрии

**Файл**: `scripts/generate-test-telemetry.ts`

```typescript
import { TelemetryService } from '../microservices/telemetry-service';

async function generateTestTelemetry(wardId: string, deviceId: string, days: number = 7) {
  const service = new TelemetryService();
  const now = new Date();
  
  for (let day = 0; day < days; day++) {
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const timestamp = new Date(now);
        timestamp.setDate(timestamp.getDate() - day);
        timestamp.setHours(hour, minute, 0, 0);
        
        // Генерация реалистичных данных
        const heartRate = 65 + Math.floor(Math.random() * 20);
        const steps = Math.floor(Math.random() * 100);
        const spo2 = 95 + Math.floor(Math.random() * 5);
        
        await service.create({
          deviceId,
          wardId,
          metrics: [
            { type: 'heart_rate', value: heartRate, unit: 'bpm', timestamp },
            { type: 'steps', value: steps, unit: 'count', timestamp },
            { type: 'spo2', value: spo2, unit: 'percent', timestamp }
          ]
        });
      }
    }
  }
}
```

## Фикстуры для E2E тестов

**Файл**: `tests/fixtures/users.fixture.ts`

```typescript
export const testUsers = {
  guardian: {
    email: 'guardian@test.com',
    password: 'Test1234!',
    fullName: 'Test Guardian',
    role: 'guardian'
  },
  ward: {
    email: 'ward@test.com',
    password: 'Test1234!',
    fullName: 'Test Ward',
    role: 'ward',
    dateOfBirth: '1945-05-15'
  },
  dispatcher: {
    email: 'dispatcher@test.com',
    password: 'Test1234!',
    fullName: 'Test Dispatcher',
    role: 'dispatcher'
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test1234!',
    fullName: 'Test Admin',
    role: 'admin'
  }
};
```

## Команды для работы с тестовыми данными

```bash
# Применить все seed-скрипты
npm run db:seed

# Очистить тестовые данные
npm run db:seed:clean

# Генерация тестовой телеметрии
npm run test:generate-telemetry -- --ward-id=ward-456 --days=7

# Запуск тестов с моками
npm run test:unit
npm run test:integration
npm run test:e2e
```

