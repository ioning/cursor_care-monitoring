import { createLogger } from './logger';

export interface AuditEvent {
  eventType: string;
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  service: string;
}

const auditLogger = createLogger({ 
  serviceName: 'audit-logger',
  format: 'json',
});

/**
 * Audit Logger for tracking critical operations
 * Logs to both application logs and can be extended to send to external audit systems
 */
export class AuditLogger {
  private readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Log an audit event
   */
  log(event: Omit<AuditEvent, 'timestamp' | 'service'>): void {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
    };

    // Log as structured JSON for easy parsing
    auditLogger.info('AUDIT', auditEvent);

    // TODO: In production, also send to:
    // - Centralized audit log system (ELK, Splunk, etc.)
    // - Database audit table
    // - Security Information and Event Management (SIEM) system
  }

  /**
   * Log authentication events
   */
  logAuth(action: 'login' | 'logout' | 'register' | 'login_failed' | 'token_refresh' | 'password_change', details: {
    userId?: string;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
  }): void {
    this.log({
      eventType: 'auth',
      action,
      userId: details.userId,
      details: {
        email: details.email,
        reason: details.reason,
      },
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
    });
  }

  /**
   * Log data access events
   */
  logDataAccess(action: 'read' | 'create' | 'update' | 'delete', details: {
    userId: string;
    resource: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): void {
    this.log({
      eventType: 'data_access',
      action,
      userId: details.userId,
      resource: details.resource,
      resourceId: details.resourceId,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
    });
  }

  /**
   * Log security events
   */
  logSecurity(action: 'unauthorized_access' | 'rate_limit_exceeded' | 'suspicious_activity', details: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    reason: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): void {
    this.log({
      eventType: 'security',
      action,
      userId: details.userId,
      details: {
        reason: details.reason,
        severity: details.severity,
      },
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
    });

    // For critical security events, also log as error
    if (details.severity === 'critical' || details.severity === 'high') {
      auditLogger.error('SECURITY_EVENT', {
        action,
        severity: details.severity,
        reason: details.reason,
        userId: details.userId,
        ipAddress: details.ipAddress,
      });
    }
  }

  /**
   * Log payment events
   */
  logPayment(action: 'payment_created' | 'payment_succeeded' | 'payment_failed' | 'refund', details: {
    userId: string;
    paymentId: string;
    amount: number;
    currency: string;
    provider?: string;
    ipAddress?: string;
  }): void {
    this.log({
      eventType: 'payment',
      action,
      userId: details.userId,
      resource: 'payment',
      resourceId: details.paymentId,
      details: {
        amount: details.amount,
        currency: details.currency,
        provider: details.provider,
      },
      ipAddress: details.ipAddress,
    });
  }

  /**
   * Log configuration changes
   */
  logConfigChange(action: 'update' | 'delete', details: {
    userId: string;
    resource: string;
    resourceId?: string;
    changes: Record<string, any>;
    ipAddress?: string;
  }): void {
    this.log({
      eventType: 'config_change',
      action,
      userId: details.userId,
      resource: details.resource,
      resourceId: details.resourceId,
      details: {
        changes: details.changes,
      },
      ipAddress: details.ipAddress,
    });
  }
}

/**
 * Create an audit logger instance for a service
 */
export function createAuditLogger(serviceName: string): AuditLogger {
  return new AuditLogger(serviceName);
}

