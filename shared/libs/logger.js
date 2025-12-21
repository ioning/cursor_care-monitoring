"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
exports.getLogger = getLogger;
exports.setCorrelationId = setCorrelationId;
const winston = require("winston");
let loggerInstance = null;
function createLogger(config = {}) {
    if (loggerInstance) {
        return loggerInstance;
    }
    const { level = 'info', format = 'json', serviceName = 'app' } = config;
    const logFormat = format === 'json'
        ? winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json())
        : winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level.toUpperCase()}] [${serviceName}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        }));
    loggerInstance = winston.createLogger({
        level,
        format: logFormat,
        defaultMeta: { service: serviceName },
        transports: [
            new winston.transports.Console({
                stderrLevels: ['error'],
            }),
        ],
    });
    return loggerInstance;
}
function getLogger() {
    if (!loggerInstance) {
        return createLogger();
    }
    return loggerInstance;
}
function setCorrelationId(correlationId) {
    if (loggerInstance) {
        loggerInstance.defaultMeta = {
            ...loggerInstance.defaultMeta,
            correlationId,
        };
    }
}
//# sourceMappingURL=logger.js.map