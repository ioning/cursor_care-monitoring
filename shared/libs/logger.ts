import winston from 'winston';

export interface LoggerConfig {
  level?: string;
  format?: 'json' | 'simple';
  serviceName?: string;
}

let loggerInstance: winston.Logger | null = null;

export function createLogger(config: LoggerConfig = {}): winston.Logger {
  if (loggerInstance) {
    return loggerInstance;
  }

  const { level = 'info', format = 'json', serviceName = 'app' } = config;

  const logFormat = format === 'json'
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    : winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level.toUpperCase()}] [${serviceName}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      );

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

export function getLogger(): winston.Logger {
  if (!loggerInstance) {
    return createLogger();
  }
  return loggerInstance;
}

export function setCorrelationId(correlationId: string): void {
  if (loggerInstance) {
    loggerInstance.defaultMeta = {
      ...loggerInstance.defaultMeta,
      correlationId,
    };
  }
}

