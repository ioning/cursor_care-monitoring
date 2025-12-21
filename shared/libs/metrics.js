"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rabbitmqMessagesConsumed = exports.rabbitmqMessagesPublished = exports.dbConnectionsActive = exports.dbQueryDuration = exports.telemetryProcessingLag = exports.activeUsersCount = exports.notificationsFailedTotal = exports.notificationsSentTotal = exports.aiPredictionsFailedTotal = exports.aiPredictionsTotal = exports.emergencyCallsPending = exports.alertsActiveCount = exports.alertsCreatedTotal = exports.telemetryReceivedTotal = exports.httpRequestsTotal = exports.httpRequestDuration = exports.register = void 0;
exports.recordHttpRequest = recordHttpRequest;
exports.getMetrics = getMetrics;
const prom_client_1 = require("prom-client");
const logger_1 = require("./logger");
const logger = (0, logger_1.createLogger)({ serviceName: 'metrics' });
exports.register = new prom_client_1.Registry();
(0, prom_client_1.collectDefaultMetrics)({ register: exports.register });
exports.httpRequestDuration = new prom_client_1.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    registers: [exports.register],
});
exports.httpRequestsTotal = new prom_client_1.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [exports.register],
});
exports.telemetryReceivedTotal = new prom_client_1.Counter({
    name: 'telemetry_received_total',
    help: 'Total number of telemetry data points received',
    labelNames: ['metric_type'],
    registers: [exports.register],
});
exports.alertsCreatedTotal = new prom_client_1.Counter({
    name: 'alerts_created_total',
    help: 'Total number of alerts created',
    labelNames: ['alert_type', 'severity'],
    registers: [exports.register],
});
exports.alertsActiveCount = new prom_client_1.Gauge({
    name: 'alerts_active_count',
    help: 'Number of active alerts',
    labelNames: ['severity'],
    registers: [exports.register],
});
exports.emergencyCallsPending = new prom_client_1.Gauge({
    name: 'emergency_calls_pending',
    help: 'Number of pending emergency calls',
    registers: [exports.register],
});
exports.aiPredictionsTotal = new prom_client_1.Counter({
    name: 'ai_predictions_total',
    help: 'Total number of AI predictions',
    labelNames: ['prediction_type', 'model_id'],
    registers: [exports.register],
});
exports.aiPredictionsFailedTotal = new prom_client_1.Counter({
    name: 'ai_predictions_failed_total',
    help: 'Total number of failed AI predictions',
    labelNames: ['model_id'],
    registers: [exports.register],
});
exports.notificationsSentTotal = new prom_client_1.Counter({
    name: 'notifications_sent_total',
    help: 'Total number of notifications sent',
    labelNames: ['channel', 'status'],
    registers: [exports.register],
});
exports.notificationsFailedTotal = new prom_client_1.Counter({
    name: 'notifications_failed_total',
    help: 'Total number of failed notifications',
    labelNames: ['channel'],
    registers: [exports.register],
});
exports.activeUsersCount = new prom_client_1.Gauge({
    name: 'active_users_count',
    help: 'Number of active users',
    registers: [exports.register],
});
exports.telemetryProcessingLag = new prom_client_1.Gauge({
    name: 'telemetry_processing_lag_seconds',
    help: 'Telemetry processing lag in seconds',
    registers: [exports.register],
});
exports.dbQueryDuration = new prom_client_1.Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['query', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [exports.register],
});
exports.dbConnectionsActive = new prom_client_1.Gauge({
    name: 'db_connections_active',
    help: 'Number of active database connections',
    registers: [exports.register],
});
exports.rabbitmqMessagesPublished = new prom_client_1.Counter({
    name: 'rabbitmq_messages_published_total',
    help: 'Total number of messages published to RabbitMQ',
    labelNames: ['exchange', 'routing_key'],
    registers: [exports.register],
});
exports.rabbitmqMessagesConsumed = new prom_client_1.Counter({
    name: 'rabbitmq_messages_consumed_total',
    help: 'Total number of messages consumed from RabbitMQ',
    labelNames: ['queue', 'status'],
    registers: [exports.register],
});
function recordHttpRequest(method, route, status, duration) {
    exports.httpRequestDuration.observe({ method, route, status: status.toString() }, duration);
    exports.httpRequestsTotal.inc({ method, route, status: status.toString() });
}
async function getMetrics() {
    return exports.register.metrics();
}
logger.info('Metrics initialized');
//# sourceMappingURL=metrics.js.map