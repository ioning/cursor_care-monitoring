import { Injectable, BadRequestException } from '@nestjs/common';
import { FallPredictionModel } from '../../infrastructure/ml-models/fall-prediction.model';
import { PredictionRepository } from '../../infrastructure/repositories/prediction.repository';
import { PredictionEventPublisher } from '../../infrastructure/messaging/prediction-event.publisher';
import { TelemetryReceivedEvent } from '../../../../shared/types/event.types';
import { createLogger } from '../../../../shared/libs/logger';
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
    private readonly eventPublisher: PredictionEventPublisher,
  ) {}

  async processTelemetry(event: TelemetryReceivedEvent): Promise<void> {
    const startTime = Date.now();
    const correlationId = event.correlationId || randomUUID();

    try {
      // Validate event
      this.validateEvent(event);

      // Extract and normalize features from telemetry
      const features = await this.extractFeatures(event.data, event.wardId);

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
}


      // If high risk, publish risk alert
      if (fallPrediction.riskScore > 0.7) {
        await this.eventPublisher.publishRiskAlert({
          eventId: randomUUID(),
          eventType: 'ai.risk.alert',
          timestamp: new Date().toISOString(),
          version: '1.0',
          correlationId: event.correlationId,
          source: 'ai-prediction-service',
          wardId: event.wardId,
          data: {
            alertType: 'high_fall_risk',
            riskScore: fallPrediction.riskScore,
            confidence: fallPrediction.confidence,
            priority: Math.round(fallPrediction.riskScore * 10),
            severity: fallPrediction.severity,
            recommendation: 'Immediate monitoring recommended',
            modelId: 'fall-prediction-v1.0',
            modelVersion: '1.0.0',
          },
        });
      }

      const latency = Date.now() - startTime;
      this.logger.info(`Prediction generated for ward ${event.wardId}`, {
        wardId: event.wardId,
        riskScore: fallPrediction.riskScore,
        latencyMs: latency,
      });
    } catch (error) {
      this.logger.error('Error processing telemetry', { error, eventId: event.eventId });
    }
  }

  private extractFeatures(data: TelemetryReceivedEvent['data']): Record<string, any> {
    const features: Record<string, any> = {};

    // Extract metrics
    for (const metric of data.metrics) {
      features[metric.type] = metric.value;
    }

    // Extract activity from accelerometer if available
    const accelMetric = data.metrics.find((m) => m.type === 'activity');
    if (accelMetric) {
      features.activity = accelMetric.value;
    }

    // Add time-based features
    const hour = new Date(data.metrics[0]?.timestamp || Date.now()).getHours();
    features.timeOfDay = hour >= 6 && hour < 22 ? 'day' : 'night';
    features.hour = hour;

    return features;
  }
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
}

