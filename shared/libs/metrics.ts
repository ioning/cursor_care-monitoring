import { Counter, Histogram, Gauge, Registry, collectDefaultMetrics } from 'prom-client';
import { createLogger } from './logger';

const logger = createLogger({ serviceName: 'metrics' });

// Create a Registry to register the metrics
export const register = new Registry();

// Add default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// HTTP Metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// Business Metrics
export const telemetryReceivedTotal = new Counter({
  name: 'telemetry_received_total',
  help: 'Total number of telemetry data points received',
  labelNames: ['metric_type'],
  registers: [register],
});

export const alertsCreatedTotal = new Counter({
  name: 'alerts_created_total',
  help: 'Total number of alerts created',
  labelNames: ['alert_type', 'severity'],
  registers: [register],
});

export const alertsActiveCount = new Gauge({
  name: 'alerts_active_count',
  help: 'Number of active alerts',
  labelNames: ['severity'],
  registers: [register],
});

export const emergencyCallsPending = new Gauge({
  name: 'emergency_calls_pending',
  help: 'Number of pending emergency calls',
  registers: [register],
});

export const aiPredictionsTotal = new Counter({
  name: 'ai_predictions_total',
  help: 'Total number of AI predictions',
  labelNames: ['prediction_type', 'model_id'],
  registers: [register],
});

export const aiPredictionsFailedTotal = new Counter({
  name: 'ai_predictions_failed_total',
  help: 'Total number of failed AI predictions',
  labelNames: ['model_id'],
  registers: [register],
});

export const notificationsSentTotal = new Counter({
  name: 'notifications_sent_total',
  help: 'Total number of notifications sent',
  labelNames: ['channel', 'status'],
  registers: [register],
});

export const notificationsFailedTotal = new Counter({
  name: 'notifications_failed_total',
  help: 'Total number of failed notifications',
  labelNames: ['channel'],
  registers: [register],
});

export const activeUsersCount = new Gauge({
  name: 'active_users_count',
  help: 'Number of active users',
  registers: [register],
});

export const telemetryProcessingLag = new Gauge({
  name: 'telemetry_processing_lag_seconds',
  help: 'Telemetry processing lag in seconds',
  registers: [register],
});

// Database Metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const dbConnectionsActive = new Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

// RabbitMQ Metrics
export const rabbitmqMessagesPublished = new Counter({
  name: 'rabbitmq_messages_published_total',
  help: 'Total number of messages published to RabbitMQ',
  labelNames: ['exchange', 'routing_key'],
  registers: [register],
});

export const rabbitmqMessagesConsumed = new Counter({
  name: 'rabbitmq_messages_consumed_total',
  help: 'Total number of messages consumed from RabbitMQ',
  labelNames: ['queue', 'status'],
  registers: [register],
});

// Helper function to record HTTP request
export function recordHttpRequest(
  method: string,
  route: string,
  status: number,
  duration: number
) {
  httpRequestDuration.observe({ method, route, status: status.toString() }, duration);
  httpRequestsTotal.inc({ method, route, status: status.toString() });
}

// Helper function to get metrics as string
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

// Initialize metrics
logger.info('Metrics initialized');

