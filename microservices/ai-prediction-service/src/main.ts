import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { createLogger } from '../../../shared/libs/logger';
import { createDatabaseConnection } from '../../../shared/libs/database';
import { createRabbitMQConnection, consumeEvent } from '../../../shared/libs/rabbitmq';
import { TelemetryReceivedEvent } from '../../../shared/types/event.types';
import { AIPredictionService } from './application/services/ai-prediction.service';

async function bootstrap() {
  const logger = createLogger({ serviceName: 'ai-prediction-service' });

  // Avoid global DB_* (often DB_USER=postgres on Windows). Prefer docker-compose POSTGRES_* defaults.
  const safeDbUser =
    process.env.POSTGRES_USER ||
    (process.env.DB_USER && process.env.DB_USER !== 'postgres' ? process.env.DB_USER : undefined) ||
    'cms_user';
  const safeDbPassword =
    process.env.POSTGRES_PASSWORD ||
    (process.env.DB_PASSWORD && process.env.DB_USER !== 'postgres' ? process.env.DB_PASSWORD : undefined) ||
    'cms_password';

  // Initialize database
  createDatabaseConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ai_prediction_db',
    user: safeDbUser,
    password: safeDbPassword,
  });

  // Initialize RabbitMQ
  await createRabbitMQConnection({
    url: process.env.RABBITMQ_URL || 'amqp://cms:cms@localhost:5672',
    exchange: 'care-monitoring.events',
  });

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.setGlobalPrefix('ai-predictions');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3011;
  await app.listen(port);

  // Start consuming telemetry events
  const aiService = app.get(AIPredictionService);
  await consumeEvent('telemetry-queue', async (event: TelemetryReceivedEvent) => {
    await aiService.processTelemetry(event);
  });

  logger.info(`AI Prediction Service is running on: http://localhost:${port}`);
}

bootstrap();

