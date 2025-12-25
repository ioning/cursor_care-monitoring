import { Injectable, BadRequestException } from '@nestjs/common';
import { FallPredictionModel } from '../../infrastructure/ml-models/fall-prediction.model';
import { PredictionRepository } from '../../infrastructure/repositories/prediction.repository';
import { EscalationPatternRepository } from '../../infrastructure/repositories/escalation-pattern.repository';
import { AlertServiceClient } from '../../infrastructure/clients/alert-service.client';
import { PredictionEventPublisher } from '../../infrastructure/messaging/prediction-event.publisher';
import { TelemetryReceivedEvent, AlertCreatedEvent } from '../../../../../shared/types/event.types';
import { createLogger } from '../../../../../shared/libs/logger';
import { randomUUID } from 'crypto';

interface ProcessedFeatures {
  [key: string]: any;
  activity?: number;
  heart_rate?: number;
  heart_rate_variability?: number;
  steps?: number;
  accelerometer_magnitude?: number;
  spo2?: number;
  timeOfDay?: 'day' | 'night';
  hour?: number;
}

@Injectable()
export class AIPredictionService {
  private readonly logger = createLogger({ serviceName: 'ai-prediction-service' });
  private readonly modelId = 'fall-prediction-v1.1';
  private readonly modelVersion = '1.1.0';
  private readonly riskThreshold = 0.7;
  private readonly maxRetries = 3;
  private readonly retryDelayMs = 1000;

  constructor(
    private readonly fallPredictionModel: FallPredictionModel,
    private readonly predictionRepository: PredictionRepository,
    private readonly escalationPatternRepository: EscalationPatternRepository,
    private readonly alertServiceClient: AlertServiceClient,
    private readonly eventPublisher: PredictionEventPublisher,
  ) {}

  async processTelemetry(event: TelemetryReceivedEvent): Promise<void> {
    const startTime = Date.now();
    const correlationId = event.correlationId || randomUUID();

    try {
      // Validate event
      this.validateEvent(event);

      // Extract and normalize features from telemetry
      // Include temporal escalation data for better prediction
      const features = await this.extractFeatures(event.data, event.wardId);
      
      // Add temporal escalation features
      const escalationFeatures = await this.getEscalationFeatures(event.wardId!);
      Object.assign(features, escalationFeatures);

      // Validate features
      if (!this.hasMinimumFeatures(features)) {
        this.logger.warn('Insufficient features for prediction', {
          wardId: event.wardId,
          availableFeatures: Object.keys(features),
        });
        return;
      }

      // Run fall prediction with retry logic
      const fallPrediction = await this.predictWithRetry(features);

      // Save prediction
      const predictionId = randomUUID();
      await this.predictionRepository.save({
        id: predictionId,
        wardId: event.wardId!,
        modelId: this.modelId,
        predictionType: 'fall_prediction',
        inputFeatures: features,
        output: fallPrediction,
        timestamp: new Date(event.timestamp),
      });

      // Publish prediction event
      await this.publishPredictionEvent(event, features, fallPrediction, startTime, correlationId);

      // If high risk, publish risk alert
      if (fallPrediction.riskScore >= this.riskThreshold) {
        await this.publishRiskAlert(event, fallPrediction, correlationId);
      }

      const latency = Date.now() - startTime;
      this.logger.info(`Prediction generated for ward ${event.wardId}`, {
        wardId: event.wardId,
        predictionId,
        riskScore: fallPrediction.riskScore,
        severity: fallPrediction.severity,
        confidence: fallPrediction.confidence,
        latencyMs: latency,
        factors: fallPrediction.factors,
      });
    } catch (error) {
      const latency = Date.now() - startTime;
      this.logger.error('Error processing telemetry', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        eventId: event.eventId,
        wardId: event.wardId,
        correlationId,
        latencyMs: latency,
      });

      // Re-throw if it's a validation error
      if (error instanceof BadRequestException) {
        throw error;
      }

      // For other errors, we don't want to crash the service
      // The error is logged and processing continues
    }
  }

  private validateEvent(event: TelemetryReceivedEvent): void {
    if (!event.wardId) {
      throw new BadRequestException('Missing wardId in telemetry event');
    }

    if (!event.data || !event.data.metrics || event.data.metrics.length === 0) {
      throw new BadRequestException('Missing or empty metrics in telemetry event');
    }

    if (!event.timestamp) {
      throw new BadRequestException('Missing timestamp in telemetry event');
    }
  }

  private hasMinimumFeatures(features: ProcessedFeatures): boolean {
    // Require at least 2 key features for prediction
    const keyFeatures = ['activity', 'heart_rate', 'steps', 'accelerometer_magnitude', 'spo2'];
    const availableCount = keyFeatures.filter((key) => features[key] !== undefined).length;
    return availableCount >= 2;
  }

  private async predictWithRetry(features: ProcessedFeatures, attempt = 1): Promise<any> {
    try {
      return await this.fallPredictionModel.predict(features);
    } catch (error) {
      if (attempt >= this.maxRetries) {
        this.logger.error('Max retries reached for prediction', {
          attempt,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }

      this.logger.warn(`Prediction attempt ${attempt} failed, retrying...`, {
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });

      await this.delay(this.retryDelayMs * attempt);
      return this.predictWithRetry(features, attempt + 1);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async extractFeatures(
    data: TelemetryReceivedEvent['data'],
    wardId?: string,
  ): Promise<ProcessedFeatures> {
    const features: ProcessedFeatures = {};
    const metricMap = new Map<string, number>();
    const timestamps: number[] = [];

    // Extract and normalize metrics
    for (const metric of data.metrics) {
      const value = this.normalizeMetricValue(metric.type, metric.value);
      if (value !== null && value !== undefined && !isNaN(value)) {
        metricMap.set(metric.type, value);
        metricMap.set(`${metric.type}_raw`, metric.value);

        // Store quality score if available
        if (metric.qualityScore !== undefined) {
          metricMap.set(`${metric.type}_quality`, metric.qualityScore);
        }

        // Collect timestamps
        if (metric.timestamp) {
          timestamps.push(new Date(metric.timestamp).getTime());
        }
      }
    }

    // Map common metric types
    features.activity = metricMap.get('activity') ?? metricMap.get('movement');
    features.heart_rate = metricMap.get('heart_rate') ?? metricMap.get('hr');
    features.heart_rate_variability = metricMap.get('heart_rate_variability') ?? metricMap.get('hrv');
    features.steps = metricMap.get('steps') ?? metricMap.get('step_count');
    features.spo2 = metricMap.get('spo2') ?? metricMap.get('oxygen_saturation');

    // Calculate accelerometer magnitude if x, y, z components are available
    const accelX = metricMap.get('accelerometer_x') ?? metricMap.get('acc_x');
    const accelY = metricMap.get('accelerometer_y') ?? metricMap.get('acc_y');
    const accelZ = metricMap.get('accelerometer_z') ?? metricMap.get('acc_z');

    if (accelX !== undefined && accelY !== undefined && accelZ !== undefined) {
      features.accelerometer_magnitude = Math.sqrt(
        Math.pow(accelX, 2) + Math.pow(accelY, 2) + Math.pow(accelZ, 2),
      );
    } else {
      features.accelerometer_magnitude = metricMap.get('accelerometer_magnitude');
    }

    // Add time-based features
    const timestamp = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
    const date = new Date(timestamp);
    features.hour = date.getHours();
    features.timeOfDay = features.hour >= 6 && features.hour < 22 ? 'day' : 'night';
    features.dayOfWeek = date.getDay();
    features.minute = date.getMinutes();

    // Calculate deltas if we have historical data (simplified - in production would fetch from DB)
    // For now, we'll use current values as baseline approximations
    if (features.heart_rate !== undefined) {
      // Assume baseline of 70 if not provided
      features.heart_rate_baseline = 70;
      features.heart_rate_delta = features.heart_rate - features.heart_rate_baseline;
    }

    // Add location context if available
    if (data.location) {
      features.hasLocation = true;
      features.locationAccuracy = data.location.accuracy;
    }

    // Add device info context
    if (data.deviceInfo) {
      features.batteryLevel = data.deviceInfo.batteryLevel;
      if (data.deviceInfo.batteryLevel !== undefined && data.deviceInfo.batteryLevel < 20) {
        features.lowBattery = true;
      }
    }

    return features;
  }

  private normalizeMetricValue(type: string, value: number): number | null {
    if (value === null || value === undefined || isNaN(value)) {
      return null;
    }

    // Apply type-specific normalization
    switch (type.toLowerCase()) {
      case 'heart_rate':
      case 'hr':
        // Normalize to reasonable range (30-200 bpm)
        return Math.max(30, Math.min(200, value));
      case 'spo2':
      case 'oxygen_saturation':
        // Normalize to 0-100%
        return Math.max(0, Math.min(100, value));
      case 'activity':
      case 'movement':
        // Normalize to 0-1
        return Math.max(0, Math.min(1, value));
      case 'steps':
      case 'step_count':
        // Ensure non-negative
        return Math.max(0, value);
      default:
        return value;
    }
  }

  private async publishPredictionEvent(
    event: TelemetryReceivedEvent,
    features: ProcessedFeatures,
    prediction: any,
    startTime: number,
    correlationId: string,
  ): Promise<void> {
    try {
      await this.eventPublisher.publishPredictionGenerated({
        eventId: randomUUID(),
        eventType: 'ai.prediction.generated',
        timestamp: new Date().toISOString(),
        version: '1.0',
        correlationId,
        source: 'ai-prediction-service',
        wardId: event.wardId,
        data: {
          predictionType: 'fall_prediction',
          modelId: this.modelId,
          modelVersion: this.modelVersion,
          inputFeatures: features,
          output: {
            riskScore: prediction.riskScore,
            confidence: prediction.confidence,
            severity: prediction.severity,
            timeHorizon: prediction.timeHorizon,
          },
          inferenceLatencyMs: Date.now() - startTime,
        },
      });
    } catch (error) {
      this.logger.error('Failed to publish prediction event', {
        error: error instanceof Error ? error.message : String(error),
        wardId: event.wardId,
      });
      // Don't throw - event publishing failure shouldn't break the flow
    }
  }

  private async publishRiskAlert(
    event: TelemetryReceivedEvent,
    prediction: any,
    correlationId: string,
  ): Promise<void> {
    try {
      const recommendations = prediction.recommendations || ['Immediate monitoring recommended'];
      const primaryRecommendation = Array.isArray(recommendations)
        ? recommendations[0]
        : recommendations;

      await this.eventPublisher.publishRiskAlert({
        eventId: randomUUID(),
        eventType: 'ai.risk.alert',
        timestamp: new Date().toISOString(),
        version: '1.0',
        correlationId,
        source: 'ai-prediction-service',
        wardId: event.wardId,
        data: {
          alertType: 'high_fall_risk',
          riskScore: prediction.riskScore,
          confidence: prediction.confidence,
          priority: Math.min(10, Math.max(1, Math.round(prediction.riskScore * 10))),
          severity: prediction.severity,
          recommendation: primaryRecommendation,
          modelId: this.modelId,
          modelVersion: this.modelVersion,
          ttl: this.calculateTTL(prediction.riskScore),
        },
      });

      this.logger.warn(`High risk alert published for ward ${event.wardId}`, {
        wardId: event.wardId,
        riskScore: prediction.riskScore,
        severity: prediction.severity,
        factors: prediction.factors,
      });
    } catch (error) {
      this.logger.error('Failed to publish risk alert', {
        error: error instanceof Error ? error.message : String(error),
        wardId: event.wardId,
      });
      // Don't throw - alert publishing failure shouldn't break the flow
    }
  }

  private calculateTTL(riskScore: number): string {
    // TTL based on risk score - higher risk = longer TTL
    const hours = riskScore >= 0.9 ? 24 : riskScore >= 0.7 ? 12 : 6;
    const ttlDate = new Date();
    ttlDate.setHours(ttlDate.getHours() + hours);
    return ttlDate.toISOString();
  }

  async getPredictionsForWard(
    wardId: string,
    options?: {
      type?: string;
      from?: Date;
      to?: Date;
      limit?: number;
    },
  ): Promise<any[]> {
    return this.predictionRepository.findByWard(wardId, options);
  }

  async getPredictionStats(wardId: string, days: number = 7): Promise<any> {
    return this.predictionRepository.getStats(wardId, days);
  }

  async getPredictionById(predictionId: string): Promise<any> {
    return this.predictionRepository.findById(predictionId);
  }

  /**
   * Process alert created event to track escalations
   */
  async processAlertCreated(event: AlertCreatedEvent): Promise<void> {
    try {
      const { wardId, data } = event;
      if (!wardId || !data) {
        return;
      }

      const currentSeverity = data.severity;
      
      // Only track if severity is critical (final state)
      if (currentSeverity === 'critical') {
        await this.trackEscalation(wardId, data.alertId, data.alertType, data.severity);
      }
    } catch (error) {
      this.logger.error('Error processing alert created event', {
        error: error instanceof Error ? error.message : String(error),
        eventId: event.eventId,
        wardId: event.wardId,
      });
    }
  }

  /**
   * Track escalation from warning to critical
   */
  private async trackEscalation(
    wardId: string,
    criticalAlertId: string,
    alertType: string,
    severity: string,
  ): Promise<void> {
    try {
      // Get recent alerts for this ward
      const recentAlerts = await this.alertServiceClient.getRecentAlerts(wardId, {
        limit: 50,
        hours: 48, // Look back 48 hours
      });

      // Find the most recent non-critical alert of the same type before this critical one
      const criticalAlert = await this.alertServiceClient.getAlertById(criticalAlertId);
      if (!criticalAlert) {
        return;
      }

      const criticalTime = new Date(criticalAlert.createdAt || criticalAlert.triggeredAt).getTime();

      // Find initial alert (low/medium/high severity) of same type before critical
      let initialAlert = null;
      for (const alert of recentAlerts) {
        const alertTime = new Date(alert.createdAt || alert.triggeredAt).getTime();
        if (
          alertTime < criticalTime &&
          alert.id !== criticalAlertId &&
          alert.alertType === alertType &&
          ['low', 'medium', 'high'].includes(alert.severity)
        ) {
          if (!initialAlert || alertTime > new Date(initialAlert.createdAt || initialAlert.triggeredAt).getTime()) {
            initialAlert = alert;
          }
        }
      }

      if (initialAlert) {
        const initialTime = new Date(initialAlert.createdAt || initialAlert.triggeredAt).getTime();
        const escalationTimeMs = criticalTime - initialTime;

        // Save escalation pattern
        await this.escalationPatternRepository.save({
          wardId,
          initialSeverity: initialAlert.severity,
          finalSeverity: 'critical',
          initialAlertId: initialAlert.id,
          finalAlertId: criticalAlertId,
          escalationTimeMs,
          alertType,
          metricsSnapshot: criticalAlert.dataSnapshot,
        });

        this.logger.info(`Escalation pattern recorded`, {
          wardId,
          alertType,
          initialSeverity: initialAlert.severity,
          escalationTimeMs,
          escalationTimeHours: Math.round(escalationTimeMs / (1000 * 60 * 60) * 100) / 100,
        });
      }
    } catch (error) {
      this.logger.error('Error tracking escalation', {
        error: error instanceof Error ? error.message : String(error),
        wardId,
        alertId: criticalAlertId,
      });
    }
  }

  /**
   * Get escalation features for prediction model
   */
  private async getEscalationFeatures(wardId: string): Promise<Record<string, any>> {
    const features: Record<string, any> = {};

    try {
      // Get recent alerts
      const recentAlerts = await this.alertServiceClient.getRecentAlerts(wardId, {
        limit: 20,
        hours: 24,
      });

      // Count alerts by severity
      const alertCounts = {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      };

      let hasRecentWarning = false;
      let timeSinceLastWarning = null;

      for (const alert of recentAlerts) {
        const severity = alert.severity;
        if (severity && alertCounts.hasOwnProperty(severity)) {
          alertCounts[severity as keyof typeof alertCounts]++;
        }

        // Check for recent warnings (low/medium/high)
        if (['low', 'medium', 'high'].includes(severity)) {
          hasRecentWarning = true;
          const alertTime = new Date(alert.createdAt || alert.triggeredAt).getTime();
          const timeSince = Date.now() - alertTime;
          if (timeSinceLastWarning === null || timeSince < timeSinceLastWarning) {
            timeSinceLastWarning = timeSince;
          }
        }
      }

      features.recent_warning_count = alertCounts.low + alertCounts.medium + alertCounts.high;
      features.recent_critical_count = alertCounts.critical;
      features.has_recent_warning = hasRecentWarning;
      features.time_since_last_warning_ms = timeSinceLastWarning;

      // Get escalation statistics
      const escalationStats = await this.escalationPatternRepository.getStats(wardId, {
        days: 90,
      });

      if (escalationStats.escalationCount > 0) {
        // Average time to critical in hours
        features.avg_time_to_critical_hours = escalationStats.averageTimeToCritical / (1000 * 60 * 60);
        features.median_time_to_critical_hours = escalationStats.medianTimeToCritical / (1000 * 60 * 60);
        features.escalation_count = escalationStats.escalationCount;

        // If we have recent warnings, calculate probability of escalation
        if (hasRecentWarning && timeSinceLastWarning !== null) {
          const timeSinceWarningHours = timeSinceLastWarning / (1000 * 60 * 60);
          const avgTimeHours = features.avg_time_to_critical_hours;

          // Probability increases as we approach average escalation time
          if (avgTimeHours > 0) {
            features.escalation_probability = Math.min(1, timeSinceWarningHours / avgTimeHours);
          } else {
            features.escalation_probability = 0;
          }
        } else {
          features.escalation_probability = 0;
        }

        // Add type-specific escalation times
        for (const [alertType, stats] of Object.entries(escalationStats.byAlertType)) {
          features[`avg_time_to_critical_${alertType}_hours`] = stats.averageTime / (1000 * 60 * 60);
        }
      } else {
        // No historical data
        features.avg_time_to_critical_hours = null;
        features.escalation_probability = 0;
        features.escalation_count = 0;
      }
    } catch (error) {
      this.logger.warn('Error getting escalation features', {
        error: error instanceof Error ? error.message : String(error),
        wardId,
      });
    }

    return features;
  }

  /**
   * Get escalation statistics for a ward
   */
  async getEscalationStats(
    wardId: string,
    options?: {
      alertType?: string;
      initialSeverity?: string;
      days?: number;
    },
  ) {
    return this.escalationPatternRepository.getStats(wardId, options);
  }

  /**
   * Get average time to critical for a given severity and alert type
   */
  async getAverageTimeToCritical(
    wardId: string,
    initialSeverity: string,
    alertType?: string,
  ): Promise<number | null> {
    const timeMs = await this.escalationPatternRepository.getAverageTimeToCritical(
      wardId,
      initialSeverity,
      alertType,
    );
    return timeMs ? timeMs / (1000 * 60 * 60) : null; // Convert to hours
  }
}

