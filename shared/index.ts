// Re-export all shared modules for easier imports
// NOTE: Avoid exporting multiple `healthCheck` symbols from different modules.
export {
  createDatabaseConnection,
  getDatabaseConnection,
  closeDatabaseConnection,
  healthCheck as databaseHealthCheck,
} from './libs/database';
export * from './libs/logger';
export {
  createRedisConnection,
  getRedisClient,
  closeRedisConnection,
  healthCheck as redisHealthCheck,
} from './libs/redis';
export {
  createRabbitMQConnection,
  getChannel,
  getRabbitMQChannel,
  closeRabbitMQConnection,
  publishEvent,
  consumeEvent,
  healthCheck as rabbitmqHealthCheck,
} from './libs/rabbitmq';
export * from './libs/retry';
export * from './libs/circuit-breaker';
export * from './libs/health-check';
export * from './libs/metrics';
export * from './libs/env-validator';
export * from './guards/jwt-auth.guard';
export * from './guards/tenant.guard';
export * from './middleware/tenant.middleware';
export * from './controllers/health.controller';
export * from './controllers/metrics.controller';
export * from './libs/audit-logger';
export * from './types/common.types';
export * from './types/event.types';

