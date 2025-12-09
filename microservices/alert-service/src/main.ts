import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createLogger } from '../../../shared/libs/logger';
import { createDatabaseConnection } from '../../../shared/libs/database';
import { createRabbitMQConnection, consumeEvent } from '../../../shared/libs/rabbitmq';
import { RiskAlertEvent } from '../../../shared/types/event.types';
import { AlertService } from './application/services/alert.service';

async function bootstrap() {
  const logger = createLogger({ serviceName: 'alert-service' });

  // Initialize database
  createDatabaseConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'alert_db',
    user: process.env.DB_USER || 'cms_user',
    password: process.env.DB_PASSWORD || 'cms_password',
  });

  // Initialize RabbitMQ
  await createRabbitMQConnection({
    url: process.env.RABBITMQ_URL || 'amqp://cms:cms@localhost:5672',
    exchange: 'care-monitoring.events',
  });

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.setGlobalPrefix('alerts');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Alert Service API')
    .setDescription('Alert management service')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('alerts/docs', app, document);

  const port = process.env.PORT || 3005;
  await app.listen(port);

  // Start consuming risk alert events
  const alertService = app.get(AlertService);
  await consumeEvent('risk-alert-queue', async (event: RiskAlertEvent) => {
    await alertService.handleRiskAlert(event);
  });

  logger.info(`Alert Service is running on: http://localhost:${port}`);
}

bootstrap();

