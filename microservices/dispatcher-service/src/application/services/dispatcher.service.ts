import { Injectable } from '@nestjs/common';
import { CallRepository } from '../../infrastructure/repositories/call.repository';
import { DispatcherRepository } from '../../infrastructure/repositories/dispatcher.repository';
import { RiskAlertEvent } from '../../../../../shared/types/event.types';
import { createLogger } from '../../../../../shared/libs/logger';
import { randomUUID } from 'crypto';
import { publishEvent } from '../../../../../shared/libs/rabbitmq';
import { CallPriority, CallStatus } from '../../../../../shared/types/common.types';

@Injectable()
export class DispatcherService {
  private readonly logger = createLogger({ serviceName: 'dispatcher-service' });

  constructor(
    private readonly callRepository: CallRepository,
    private readonly dispatcherRepository: DispatcherRepository,
  ) {}

  async handleCriticalAlert(event: RiskAlertEvent): Promise<void> {
    const callId = randomUUID();

    // Create emergency call
    const call = await this.callRepository.create({
      id: callId,
      wardId: event.wardId || 'unknown',
      callType: 'emergency',
      priority: this.determinePriority(event.data.severity, event.data.priority),
      status: CallStatus.CREATED,
      source: 'ai_prediction',
      healthSnapshot: {
        riskScore: event.data.riskScore,
        confidence: event.data.confidence,
        alertType: event.data.alertType,
      },
      aiAnalysis: {
        modelId: event.data.modelId,
        modelVersion: event.data.modelVersion,
      },
    });

    // Assign to available dispatcher
    const dispatcher = await this.assignDispatcher(callId);

    // Publish call created event
    await publishEvent(
      'care-monitoring.events',
      'dispatcher.call.created',
      {
        eventId: randomUUID(),
        eventType: 'dispatcher.call.created',
        timestamp: new Date().toISOString(),
        version: '1.0',
        correlationId: event.correlationId,
        source: 'dispatcher-service',
        wardId: event.wardId,
        data: {
          callId: call.id,
          callType: call.callType,
          priority: call.priority,
          status: call.status,
          healthSnapshot: call.healthSnapshot,
          locationSnapshot: {},
          aiAnalysis: call.aiAnalysis,
          createdAt: call.createdAt.toISOString(),
        },
      },
      { persistent: true },
    );

    this.logger.info(`Emergency call created: ${callId}`, {
      callId,
      wardId: event.wardId,
      priority: call.priority,
      dispatcherId: dispatcher?.id,
    });
  }

  async getCalls(filters: any) {
    const { status, priority, dispatcherId, page = 1, limit = 20 } = filters;
    const [calls, total] = await this.callRepository.findByFilters(
      { status, priority, dispatcherId },
      { page, limit },
    );

    return {
      calls,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  async getStats() {
    const [allCalls] = await this.callRepository.findByFilters({}, { page: 1, limit: 10000 });
    
    const stats = {
      total: allCalls.length,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
    };

    allCalls.forEach((call) => {
      stats.byStatus[call.status] = (stats.byStatus[call.status] || 0) + 1;
      stats.byPriority[call.priority] = (stats.byPriority[call.priority] || 0) + 1;
    });

    return stats;
  }

  async createCall(data: {
    wardId: string;
    callType?: string;
    priority?: CallPriority;
    source?: string;
    healthSnapshot?: Record<string, any>;
    locationSnapshot?: Record<string, any>;
    notes?: string;
  }) {
    const callId = randomUUID();

    // Create emergency call
    const call = await this.callRepository.create({
      id: callId,
      wardId: data.wardId,
      callType: data.callType || 'assistance',
      priority: data.priority || CallPriority.MEDIUM,
      status: CallStatus.CREATED,
      source: data.source || 'dispatcher_app',
      healthSnapshot: data.healthSnapshot,
      locationSnapshot: data.locationSnapshot,
    });

    // Assign to available dispatcher if not already assigned
    const dispatcher = await this.assignDispatcher(callId);

    // Publish call created event
    await publishEvent(
      'care-monitoring.events',
      'dispatcher.call.created',
      {
        eventId: randomUUID(),
        eventType: 'dispatcher.call.created',
        timestamp: new Date().toISOString(),
        version: '1.0',
        correlationId: randomUUID(),
        source: 'dispatcher-service',
        wardId: data.wardId,
        data: {
          callId: call.id,
          callType: call.callType,
          priority: call.priority,
          status: call.status,
          healthSnapshot: call.healthSnapshot,
          locationSnapshot: call.locationSnapshot,
          createdAt: call.createdAt.toISOString(),
        },
      },
      { persistent: true },
    );

    this.logger.info(`Emergency call created: ${callId}`, {
      callId,
      wardId: data.wardId,
      priority: call.priority,
      dispatcherId: dispatcher?.id,
    });

    return {
      success: true,
      data: call,
      message: 'Call created successfully',
    };
  }

  async getCall(callId: string) {
    const call = await this.callRepository.findById(callId);
    if (!call) {
      throw new Error('Call not found');
    }
    return {
      success: true,
      data: call,
    };
  }

  async assignCall(callId: string, dispatcherId: string) {
    const call = await this.callRepository.findById(callId);
    if (!call) {
      throw new Error('Call not found');
    }

    await this.callRepository.updateStatus(callId, CallStatus.ASSIGNED, dispatcherId);
    await this.dispatcherRepository.updateAvailability(dispatcherId, false);

    this.logger.info(`Call assigned: ${callId} to dispatcher ${dispatcherId}`);

    return {
      success: true,
      message: 'Call assigned successfully',
    };
  }

  async updateCallStatus(callId: string, status: string, notes?: string) {
    const nextStatus = this.parseCallStatus(status);
    await this.callRepository.updateStatus(callId, nextStatus, undefined, notes);

    const call = await this.callRepository.findById(callId);
    if (call?.dispatcherId) {
      await this.dispatcherRepository.updateAvailability(call.dispatcherId, true);
    }

    return {
      success: true,
      message: 'Call status updated',
    };
  }

  private determinePriority(severity: string, aiPriority?: number): CallPriority {
    if (aiPriority && aiPriority >= 9) return CallPriority.CRITICAL;
    if (severity === 'critical') return CallPriority.CRITICAL;
    if (severity === 'high') return CallPriority.HIGH;
    if (severity === 'medium') return CallPriority.MEDIUM;
    return CallPriority.MEDIUM;
  }

  private parseCallStatus(status: string): CallStatus {
    const normalized = (status || '').trim();
    if ((Object.values(CallStatus) as string[]).includes(normalized)) {
      return normalized as CallStatus;
    }
    throw new Error(`Invalid call status: ${status}`);
  }

  private async assignDispatcher(callId: string): Promise<any> {
    // Find available dispatcher
    const dispatcher = await this.dispatcherRepository.findAvailable();
    if (dispatcher) {
      await this.assignCall(callId, dispatcher.id);
      return dispatcher;
    }
    return null;
  }
}

