import { Pool } from 'pg';
import { createLogger } from '../shared/libs/logger';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../.env') });

const logger = createLogger({ serviceName: 'bracelet-test-data' });

const config = {
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'cms_user',
  password: process.env.POSTGRES_PASSWORD || 'cms_password',
};

function createDb(database: string) {
  return new Pool({
    ...config,
    database,
  });
}

interface TestScenario {
  name: string;
  description: string;
  metrics: Array<{
    type: string;
    value: number;
    unit: string;
    qualityScore: number;
  }>;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    source: string;
  };
  expectedAlerts?: string[];
  expectedPredictions?: boolean;
}

/**
 * Генерирует тестовые данные браслета для прохождения по всем сервисам
 * 
 * Сценарии:
 * 1. Нормальные показатели (базовый сценарий)
 * 2. Критический пульс (высокий риск)
 * 3. Низкое SpO2 (критическое состояние)
 * 4. Обнаружение падения (экстренная ситуация)
 * 5. Высокая температура (лихорадка)
 * 6. Низкая батарея (предупреждение)
 * 7. Аномальная активность (мало шагов)
 * 8. Комплексная аномалия (несколько проблем)
 */
async function ensurePgCrypto(db: Pool) {
  await db.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
}

async function generateTestData() {
  const telemetryDb = createDb('telemetry_db');
  const deviceDb = createDb('device_db');
  const authDb = createDb('auth_db');

  try {
    // Ensure extensions are enabled
    await ensurePgCrypto(telemetryDb);
    // Получаем информацию о тестовом устройстве и подопечном
    const deviceResult = await deviceDb.query(
      `SELECT id, ward_id, api_key FROM devices WHERE api_key = $1 LIMIT 1`,
      ['bracelet-demo-api-key']
    );

    if (deviceResult.rows.length === 0) {
      logger.error('Устройство не найдено. Выполните: npm run db:seed');
      process.exit(1);
    }

    const device = deviceResult.rows[0];
    const deviceId = device.id;
    const wardId = device.ward_id;

    if (!wardId) {
      logger.error('Устройство не привязано к подопечному');
      process.exit(1);
    }

    logger.info(`Найдено устройство: ${deviceId}, подопечный: ${wardId}`);

    // Получаем информацию о подопечном для расчета возраста
    const wardResult = await authDb.query(
      `SELECT id, full_name FROM users WHERE id = $1`,
      [wardId]
    );

    const wardName = wardResult.rows[0]?.full_name || 'Тестовый подопечный';
    logger.info(`Подопечный: ${wardName}`);

    // Определяем сценарии тестирования
    const scenarios: TestScenario[] = [
      {
        name: 'Нормальные показатели',
        description: 'Базовый сценарий с нормальными показателями здоровья',
        metrics: [
          { type: 'heart_rate', value: 72, unit: 'bpm', qualityScore: 0.95 },
          { type: 'spo2', value: 98, unit: '%', qualityScore: 0.92 },
          { type: 'temperature', value: 36.6, unit: 'c', qualityScore: 0.97 },
          { type: 'steps', value: 1250, unit: 'count', qualityScore: 0.90 },
          { type: 'battery', value: 85, unit: '%', qualityScore: 1.0 },
        ],
        location: {
          latitude: 55.7558,
          longitude: 37.6173,
          accuracy: 10,
          source: 'gps',
        },
      },
      {
        name: 'Критический пульс',
        description: 'Высокий пульс - требует внимания',
        metrics: [
          { type: 'heart_rate', value: 120, unit: 'bpm', qualityScore: 0.95 },
          { type: 'spo2', value: 96, unit: '%', qualityScore: 0.92 },
          { type: 'temperature', value: 37.2, unit: 'c', qualityScore: 0.97 },
          { type: 'steps', value: 500, unit: 'count', qualityScore: 0.90 },
          { type: 'battery', value: 75, unit: '%', qualityScore: 1.0 },
        ],
        location: {
          latitude: 55.7558,
          longitude: 37.6173,
          accuracy: 12,
          source: 'gps',
        },
        expectedAlerts: ['high_heart_rate'],
        expectedPredictions: true,
      },
      {
        name: 'Низкое SpO2',
        description: 'Критически низкое насыщение кислородом',
        metrics: [
          { type: 'heart_rate', value: 95, unit: 'bpm', qualityScore: 0.95 },
          { type: 'spo2', value: 88, unit: '%', qualityScore: 0.92 },
          { type: 'temperature', value: 36.8, unit: 'c', qualityScore: 0.97 },
          { type: 'steps', value: 200, unit: 'count', qualityScore: 0.90 },
          { type: 'battery', value: 70, unit: '%', qualityScore: 1.0 },
        ],
        location: {
          latitude: 55.7558,
          longitude: 37.6173,
          accuracy: 15,
          source: 'gps',
        },
        expectedAlerts: ['low_spo2'],
        expectedPredictions: true,
      },
      {
        name: 'Обнаружение падения',
        description: 'Экстренная ситуация - обнаружено падение',
        metrics: [
          { type: 'fall_detected', value: 1, unit: 'count', qualityScore: 0.95 },
          { type: 'heart_rate', value: 110, unit: 'bpm', qualityScore: 0.90 },
          { type: 'spo2', value: 94, unit: '%', qualityScore: 0.88 },
          { type: 'temperature', value: 36.5, unit: 'c', qualityScore: 0.97 },
          { type: 'battery', value: 80, unit: '%', qualityScore: 1.0 },
        ],
        location: {
          latitude: 55.7558,
          longitude: 37.6173,
          accuracy: 8,
          source: 'gps',
        },
        expectedAlerts: ['fall_detected'],
        expectedPredictions: true,
      },
      {
        name: 'Высокая температура',
        description: 'Лихорадка - повышенная температура',
        metrics: [
          { type: 'heart_rate', value: 88, unit: 'bpm', qualityScore: 0.95 },
          { type: 'spo2', value: 97, unit: '%', qualityScore: 0.92 },
          { type: 'temperature', value: 38.5, unit: 'c', qualityScore: 0.97 },
          { type: 'steps', value: 100, unit: 'count', qualityScore: 0.90 },
          { type: 'battery', value: 65, unit: '%', qualityScore: 1.0 },
        ],
        location: {
          latitude: 55.7558,
          longitude: 37.6173,
          accuracy: 10,
          source: 'gps',
        },
        expectedAlerts: ['high_temperature'],
        expectedPredictions: true,
      },
      {
        name: 'Низкая батарея',
        description: 'Предупреждение о низком заряде',
        metrics: [
          { type: 'heart_rate', value: 70, unit: 'bpm', qualityScore: 0.95 },
          { type: 'spo2', value: 98, unit: '%', qualityScore: 0.92 },
          { type: 'temperature', value: 36.6, unit: 'c', qualityScore: 0.97 },
          { type: 'steps', value: 800, unit: 'count', qualityScore: 0.90 },
          { type: 'battery', value: 15, unit: '%', qualityScore: 1.0 },
        ],
        location: {
          latitude: 55.7558,
          longitude: 37.6173,
          accuracy: 10,
          source: 'gps',
        },
        expectedAlerts: ['low_battery'],
      },
      {
        name: 'Низкая активность',
        description: 'Мало шагов - возможная проблема',
        metrics: [
          { type: 'heart_rate', value: 65, unit: 'bpm', qualityScore: 0.95 },
          { type: 'spo2', value: 97, unit: '%', qualityScore: 0.92 },
          { type: 'temperature', value: 36.4, unit: 'c', qualityScore: 0.97 },
          { type: 'steps', value: 50, unit: 'count', qualityScore: 0.90 },
          { type: 'battery', value: 90, unit: '%', qualityScore: 1.0 },
        ],
        location: {
          latitude: 55.7558,
          longitude: 37.6173,
          accuracy: 10,
          source: 'gps',
        },
        expectedPredictions: true,
      },
      {
        name: 'Комплексная аномалия',
        description: 'Несколько проблем одновременно',
        metrics: [
          { type: 'heart_rate', value: 130, unit: 'bpm', qualityScore: 0.95 },
          { type: 'spo2', value: 90, unit: '%', qualityScore: 0.92 },
          { type: 'temperature', value: 38.8, unit: 'c', qualityScore: 0.97 },
          { type: 'steps', value: 0, unit: 'count', qualityScore: 0.90 },
          { type: 'battery', value: 25, unit: '%', qualityScore: 1.0 },
        ],
        location: {
          latitude: 55.7558,
          longitude: 37.6173,
          accuracy: 10,
          source: 'gps',
        },
        expectedAlerts: ['high_heart_rate', 'low_spo2', 'high_temperature', 'low_battery'],
        expectedPredictions: true,
      },
    ];

    // Генерируем данные для каждого сценария
    const now = new Date();
    let recordCount = 0;

    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      const timestamp = new Date(now.getTime() - (scenarios.length - i) * 15 * 60 * 1000); // Каждые 15 минут

      logger.info(`\n=== Сценарий ${i + 1}: ${scenario.name} ===`);
      logger.info(`Описание: ${scenario.description}`);
      logger.info(`Время: ${timestamp.toISOString()}`);

      // Вставляем данные в raw_metrics
      for (const metric of scenario.metrics) {
        await telemetryDb.query(
          `INSERT INTO raw_metrics (id, device_id, ward_id, metric_type, value, unit, quality_score, timestamp, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            deviceId,
            wardId,
            metric.type,
            metric.value,
            metric.unit,
            metric.qualityScore,
            timestamp,
          ]
        );
        recordCount++;
      }

      // Если есть местоположение, сохраняем его (через location-service данные)
      if (scenario.location) {
        // Примечание: location-service может иметь свою таблицу, но для теста
        // мы можем сохранить координаты в комментарии или отдельной таблице
        logger.info(`Местоположение: ${scenario.location.latitude}, ${scenario.location.longitude}`);
      }

      logger.info(`Метрики: ${scenario.metrics.map(m => `${m.type}=${m.value}${m.unit}`).join(', ')}`);
      
      if (scenario.expectedAlerts && scenario.expectedAlerts.length > 0) {
        logger.info(`Ожидаемые алерты: ${scenario.expectedAlerts.join(', ')}`);
      }
      
      if (scenario.expectedPredictions) {
        logger.info('Ожидается обработка AI-prediction-service');
      }
    }

    // Генерируем дополнительные данные для временного ряда (последние 24 часа)
    logger.info('\n=== Генерация временного ряда (последние 24 часа) ===');
    const hoursBack = 24;
    const intervalMinutes = 15;

    for (let hour = 0; hour < hoursBack; hour++) {
      for (let interval = 0; interval < 4; interval++) { // Каждые 15 минут = 4 раза в час
        const timestamp = new Date(now.getTime() - hour * 60 * 60 * 1000 - interval * intervalMinutes * 60 * 1000);
        const hourOfDay = timestamp.getHours();
        const isDaytime = hourOfDay >= 6 && hourOfDay < 22;

        // Базовые значения с вариациями
        const baseHeartRate = isDaytime ? 70 + Math.random() * 15 : 60 + Math.random() * 10;
        const baseSpo2 = 96 + Math.random() * 3;
        const baseTemperature = 36.4 + Math.random() * 0.6;
        const steps = Math.floor(Math.random() * 100);
        const battery = Math.max(20, 100 - hour * 2 - interval * 0.5);

        const metrics = [
          { type: 'heart_rate', value: Math.round(baseHeartRate), unit: 'bpm', qualityScore: 0.9 + Math.random() * 0.1 },
          { type: 'spo2', value: Math.round(baseSpo2), unit: '%', qualityScore: 0.9 + Math.random() * 0.1 },
          { type: 'temperature', value: Math.round(baseTemperature * 10) / 10, unit: 'c', qualityScore: 0.95 + Math.random() * 0.05 },
          { type: 'steps', value: steps, unit: 'count', qualityScore: 0.9 },
          { type: 'battery', value: Math.round(battery), unit: '%', qualityScore: 1.0 },
        ];

        for (const metric of metrics) {
          await telemetryDb.query(
            `INSERT INTO raw_metrics (id, device_id, ward_id, metric_type, value, unit, quality_score, timestamp, created_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())`,
            [
              deviceId,
              wardId,
              metric.type,
              metric.value,
              metric.unit,
              metric.qualityScore,
              timestamp,
            ]
          );
          recordCount++;
        }
      }
    }

    logger.info(`\n=== Генерация завершена ===`);
    logger.info(`Всего создано записей: ${recordCount}`);
    logger.info(`Устройство: ${deviceId}`);
    logger.info(`Подопечный: ${wardName} (${wardId})`);
    logger.info(`\nДанные готовы для тестирования всех сервисов:`);
    logger.info(`  - Telemetry Service: данные сохранены`);
    logger.info(`  - AI Prediction Service: обработает события через RabbitMQ`);
    logger.info(`  - Alert Service: проверит критические метрики`);
    logger.info(`  - Location Service: обработает координаты`);
    logger.info(`  - Analytics Service: агрегирует данные`);
    logger.info(`\nПроверьте данные через API:`);
    logger.info(`  GET /api/v1/telemetry/wards/${wardId}/latest`);
    logger.info(`  GET /api/v1/telemetry/wards/${wardId}?from=<timestamp>&to=<timestamp>`);

  } catch (error: any) {
    logger.error('Ошибка генерации тестовых данных:', error);
    throw error;
  } finally {
    await telemetryDb.end();
    await deviceDb.end();
    await authDb.end();
  }
}

generateTestData()
  .then(() => {
    logger.info('Генерация тестовых данных завершена успешно');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Ошибка генерации:', error);
    process.exit(1);
  });

