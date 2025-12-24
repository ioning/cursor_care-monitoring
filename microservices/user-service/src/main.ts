import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { createLogger } from '../../../shared/libs/logger';
import { createDatabaseConnection } from '../../../shared/libs/database';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const logger = createLogger({ serviceName: 'user-service' });

  // Initialize database
  createDatabaseConnection({
    // IMPORTANT:
    // On developer machines, generic DB_* env vars are often set globally (e.g. DB_USER=postgres),
    // which breaks local docker-compose defaults (cms_user/cms_password).
    // Prefer service-scoped vars, then docker-compose vars, then safe defaults.
    host: process.env.USER_DB_HOST || process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.USER_DB_PORT || process.env.POSTGRES_PORT || process.env.DB_PORT || '5432'),
    database: process.env.USER_DB_NAME || process.env.POSTGRES_DB || process.env.DB_NAME || 'user_db',
    user: process.env.USER_DB_USER || process.env.POSTGRES_USER || 'cms_user',
    password: process.env.USER_DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'cms_password',
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.setGlobalPrefix('users');

  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), 'uploads', 'avatars');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve static files
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('User Service API')
    .setDescription('User and ward management service')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('users/docs', app, document);

  const port = process.env.PORT || 3002;
  await app.listen(port);

  logger.info(`User Service is running on: http://localhost:${port}`);
}

bootstrap();


