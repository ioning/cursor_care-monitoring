import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { createLogger } from '../../shared/libs/logger';
import { createDatabaseConnection } from '../../shared/libs/database';

async function bootstrap() {
  const logger = createLogger({ serviceName: 'organization-service' });

  // Initialize database
  createDatabaseConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'organization_db',
    user: process.env.DB_USER || 'cms_user',
    password: process.env.DB_PASSWORD || 'cms_password',
  });

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.setGlobalPrefix('organizations');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3012;
  await app.listen(port);

  logger.info(`Organization Service is running on: http://localhost:${port}`);
}

bootstrap();


import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { createLogger } from '../../shared/libs/logger';
import { createDatabaseConnection } from '../../shared/libs/database';

async function bootstrap() {
  const logger = createLogger({ serviceName: 'organization-service' });

  // Initialize database
  createDatabaseConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'organization_db',
    user: process.env.DB_USER || 'cms_user',
    password: process.env.DB_PASSWORD || 'cms_password',
  });

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.setGlobalPrefix('organizations');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3012;
  await app.listen(port);

  logger.info(`Organization Service is running on: http://localhost:${port}`);
}

bootstrap();







