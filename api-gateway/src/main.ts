import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WsAdapter } from '@nestjs/platform-ws';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { createLogger } from '@care-monitoring/shared/libs/logger';

async function bootstrap() {
  const logger = createLogger({ serviceName: 'api-gateway' });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
    // Don't exit in production, just log
    if (process.env.NODE_ENV === 'development') {
      console.error('Unhandled Rejection:', reason);
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    // Exit gracefully in production, log in development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // WebSocket adapter
  app.useWebSocketAdapter(new WsAdapter(app));

  // Security Headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https:'],
          fontSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      crossOriginEmbedderPolicy: false, // Disable for API compatibility
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  // In development, allow all origins for mobile apps (Android emulator, physical devices, iOS simulator)
  // In production, use strict CORS_ORIGIN from env
  const corsOrigins = process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'])
    : true; // Allow all origins in development for mobile app compatibility
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Care Monitoring System API')
    .setDescription(`
      API Gateway for Care Monitoring System - система мониторинга и предиктивной аналитики здоровья.
      
      ## Аутентификация
      
      Большинство endpoints требуют аутентификации через JWT токен. Получите токен через \`/api/v1/auth/login\` и используйте его в заголовке:
      \`Authorization: Bearer YOUR_TOKEN\`
      
      ## Примеры использования
      
      См. [API Examples](../../docs/reference/API_EXAMPLES.md) для подробных примеров использования всех endpoints.
      
      ## Health Checks
      
      - \`GET /api/v1/health\` - общий health check
      - \`GET /api/v1/health/ready\` - readiness check
      - \`GET /api/v1/health/live\` - liveness check
      - \`GET /api/v1/metrics\` - Prometheus метрики
    `)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Аутентификация и авторизация')
    .addTag('users', 'Управление пользователями и подопечными')
    .addTag('devices', 'Управление устройствами')
    .addTag('telemetry', 'Телеметрия и метрики')
    .addTag('alerts', 'Алерты и уведомления')
    .addTag('locations', 'Местоположение и геозоны')
    .addTag('billing', 'Биллинг и подписки')
    .addTag('dispatcher', 'Диспетчеризация вызовов')
    .addTag('analytics', 'Аналитика и отчеты')
    .addTag('organizations', 'Управление организациями')
    .addTag('health', 'Health checks и мониторинг')
    .addTag('metrics', 'Prometheus метрики')
    .addServer('http://localhost:3000', 'Development')
    .addServer('https://api.caremonitoring.com', 'Production')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Care Monitoring API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 3000;
  // Listen on all interfaces (0.0.0.0) to allow mobile app connections from emulators and physical devices
  await app.listen(port, '0.0.0.0');
  
  logger.info(`API Gateway is running on: http://0.0.0.0:${port} (accessible from http://localhost:${port})`);
  logger.info(`Swagger documentation: http://localhost:${port}/api/docs`);
  logger.info(`Mobile app can connect via: http://10.0.2.2:${port}/api/v1 (Android emulator) or http://<your-ip>:${port}/api/v1 (physical device)`);
}

bootstrap();

