import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createLogger } from '../../../shared/libs/logger';
import { createDatabaseConnection } from '../../../shared/libs/database';
import { createRabbitMQConnection, consumeEvent } from '../../../shared/libs/rabbitmq';
import { RiskAlertEvent } from '../../../shared/types/event.types';
import { DispatcherService } from './application/services/dispatcher.service';

async function bootstrap() {
  const logger = createLogger({ serviceName: 'dispatcher-service' });

  // Initialize database
  createDatabaseConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'dispatcher_db',
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

  app.setGlobalPrefix('dispatcher');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Dispatcher Service API')
    .setDescription('Emergency call dispatching service')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('dispatcher/docs', app, document);

  const port = process.env.PORT || 3009;
  await app.listen(port);

  // Start consuming risk alerts
  const dispatcherService = app.get(DispatcherService);
  await consumeEvent('dispatcher-risk-alert-queue', async (event: RiskAlertEvent) => {
    if (event.data.severity === 'critical' || event.data.priority >= 8) {
      await dispatcherService.handleCriticalAlert(event);
    }
  });

  logger.info(`Dispatcher Service is running on: http://localhost:${port}`);
}

bootstrap();

