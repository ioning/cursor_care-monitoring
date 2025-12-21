import * as winston from 'winston';
export interface LoggerConfig {
    level?: string;
    format?: 'json' | 'simple';
    serviceName?: string;
}
export declare function createLogger(config?: LoggerConfig): winston.Logger;
export declare function getLogger(): winston.Logger;
export declare function setCorrelationId(correlationId: string): void;
