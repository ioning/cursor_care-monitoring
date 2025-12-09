import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createLogger } from '../../../shared/libs/logger';
import { createDatabaseConnection } from '../../../shared/libs/database';
import { createRabbitMQConnection, consumeEvent } from '../../../shared/libs/rabbitmq';
import { AlertCreatedEvent } from '../../../shared/types/event.types';
import { IntegrationService } from './application/services/integration.service';

async function bootstrap() {
  const logger = createLogger({ serviceName: 'integration-service' });

  // Initialize database
  createDatabaseConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'integration_db',
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

  app.setGlobalPrefix('integrations');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Integration Service API')
    .setDescription('External integrations service (SMS, Email, Push, Telegram)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('integrations/docs', app, document);

  const port = process.env.PORT || 3008;
  await app.listen(port);

  // Start consuming alert events
  const integrationService = app.get(IntegrationService);
  await consumeEvent('alert-created-queue', async (event: AlertCreatedEvent) => {
    await integrationService.handleAlertCreated(event);
  });

  logger.info(`Integration Service is running on: http://localhost:${port}`);
}

bootstrap();

