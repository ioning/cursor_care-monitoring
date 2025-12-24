import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { createLogger } from '../../../shared/libs/logger';
import { createDatabaseConnection } from '../../../shared/libs/database';

async function bootstrap() {
  const logger = createLogger({ serviceName: 'organization-service' });

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
    database: process.env.DB_NAME || 'organization_db',
    user: safeDbUser,
    password: safeDbPassword,
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







