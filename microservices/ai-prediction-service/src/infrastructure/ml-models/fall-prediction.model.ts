import { Injectable } from '@nestjs/common';

export interface FallPrediction {
  riskScore: number; // 0-1
  confidence: number; // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical';
  timeHorizon?: string;
  factors?: string[]; // Contributing factors
  recommendations?: string[];
}

interface FeatureWeights {
  activity: number;
  heartRate: number;
  heartRateVariability: number;
  steps: number;
  accelerometer: number;
  timeOfDay: number;
  movementPattern: number;
  spo2: number;
}

@Injectable()
export class FallPredictionModel {
  private readonly modelVersion = '1.1.0';
  private readonly weights: FeatureWeights = {
    activity: 0.25,
    heartRate: 0.20,
    heartRateVariability: 0.15,
    steps: 0.10,
    accelerometer: 0.15,
    timeOfDay: 0.05,
    movementPattern: 0.05,
    spo2: 0.05,
  };

  async predict(features: Record<string, any>): Promise<FallPrediction> {
    // Enhanced heuristic-based model with weighted factors
    // In production, this would be replaced with a trained ML model

    const factors: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0.0;
    let confidence = 0.85;

    // Normalize and evaluate activity level
    const activityScore = this.evaluateActivity(features);
    if (activityScore > 0) {
      riskScore += activityScore * this.weights.activity;
      factors.push('abnormal_activity');
    }

    // Evaluate heart rate patterns
    const hrScore = this.evaluateHeartRate(features);
    if (hrScore > 0) {
      riskScore += hrScore * this.weights.heartRate;
      if (features.heart_rate > 100) {
        factors.push('elevated_heart_rate');
        recommendations.push('Monitor heart rate closely');
      } else if (features.heart_rate < 50) {
        factors.push('low_heart_rate');
        recommendations.push('Check for medical emergency');
      }
    }

    // Evaluate heart rate variability
    const hrvScore = this.evaluateHRV(features);
    if (hrvScore > 0) {
      riskScore += hrvScore * this.weights.heartRateVariability;
      factors.push('irregular_hrv');
    }

    // Evaluate step count and movement
    const stepsScore = this.evaluateSteps(features);
    if (stepsScore > 0) {
      riskScore += stepsScore * this.weights.steps;
      factors.push('reduced_mobility');
    }

    // Evaluate accelerometer data
    const accelScore = this.evaluateAccelerometer(features);
    if (accelScore > 0) {
      riskScore += accelScore * this.weights.accelerometer;
      factors.push('sudden_movement');
      recommendations.push('Check for fall event');
    }

    // Evaluate SpO2 levels
    const spo2Score = this.evaluateSpO2(features);
    if (spo2Score > 0) {
      riskScore += spo2Score * this.weights.spo2;
      factors.push('low_oxygen');
      recommendations.push('Check oxygen saturation');
    }

    // Time-based risk adjustment
    const timeScore = this.evaluateTimeOfDay(features);
    riskScore += timeScore * this.weights.timeOfDay;
    if (timeScore > 0) {
      factors.push('night_time_risk');
    }

    // Movement pattern analysis
    const movementScore = this.evaluateMovementPattern(features);
    if (movementScore > 0) {
      riskScore += movementScore * this.weights.movementPattern;
      factors.push('irregular_movement');
    }

    // Normalize risk score to 0-1
    riskScore = Math.min(1.0, Math.max(0.0, riskScore));

    // Adjust confidence based on data quality
    confidence = this.calculateConfidence(features, riskScore);

    // Determine severity
    const severity = this.determineSeverity(riskScore);

    // Calculate time horizon based on risk
    const timeHorizon = this.calculateTimeHorizon(riskScore);

    // Add default recommendations if none
    if (recommendations.length === 0 && riskScore > 0.3) {
      recommendations.push('Continue monitoring');
    }

    return {
      riskScore: Math.round(riskScore * 100) / 100, // Round to 2 decimals
      confidence: Math.round(confidence * 100) / 100,
      severity,
      timeHorizon,
      factors: factors.length > 0 ? factors : undefined,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  private evaluateActivity(features: Record<string, any>): number {
    if (features.activity === undefined) return 0;

    // Very low activity might indicate lying down (after fall)
    if (features.activity < 0.1) return 0.8;
    if (features.activity < 0.2) return 0.5;
    if (features.activity < 0.3) return 0.2;

    // Sudden drop in activity
    if (features.activityDelta !== undefined && features.activityDelta < -0.5) {
      return 0.6;
    }

    return 0;
  }

  private evaluateHeartRate(features: Record<string, any>): number {
    if (features.heart_rate === undefined) return 0;

    const hr = features.heart_rate;
    const baseline = features.heart_rate_baseline || 70;

    // Very high heart rate
    if (hr > 120) return 0.7;
    if (hr > 100) return 0.4;

    // Very low heart rate
    if (hr < 40) return 0.9;
    if (hr < 50) return 0.6;

    // Significant deviation from baseline
    const deviation = Math.abs(hr - baseline) / baseline;
    if (deviation > 0.3) return 0.3;

    return 0;
  }

  private evaluateHRV(features: Record<string, any>): number {
    if (features.heart_rate_variability === undefined) return 0;

    const hrv = features.heart_rate_variability;
    // Low HRV might indicate stress or health issues
    if (hrv < 20) return 0.5;
    if (hrv < 30) return 0.3;

    // Very high HRV might also be concerning
    if (hrv > 100) return 0.2;

    return 0;
  }

  private evaluateSteps(features: Record<string, any>): number {
    if (features.steps === undefined) return 0;

    const steps = features.steps;
    const expectedSteps = features.expected_steps || 1000;

    // Very low step count
    if (steps < expectedSteps * 0.1) return 0.6;
    if (steps < expectedSteps * 0.3) return 0.3;

    // Sudden drop in steps
    if (features.steps_delta !== undefined && features.steps_delta < -0.5) {
      return 0.4;
    }

    return 0;
  }

  private evaluateAccelerometer(features: Record<string, any>): number {
    if (features.accelerometer_magnitude === undefined) return 0;

    const magnitude = features.accelerometer_magnitude;
    const normalGravity = 9.8;

    // Sudden high acceleration (potential fall)
    if (magnitude > normalGravity * 2) return 0.9;
    if (magnitude > normalGravity * 1.5) return 0.6;

    // Sudden change in acceleration
    if (features.accelerometer_delta !== undefined) {
      const delta = Math.abs(features.accelerometer_delta);
      if (delta > normalGravity * 0.5) return 0.5;
    }

    return 0;
  }

  private evaluateSpO2(features: Record<string, any>): number {
    if (features.spo2 === undefined) return 0;

    const spo2 = features.spo2;

    // Critical oxygen levels
    if (spo2 < 85) return 0.9;
    if (spo2 < 90) return 0.6;
    if (spo2 < 94) return 0.3;

    return 0;
  }

  private evaluateTimeOfDay(features: Record<string, any>): number {
    if (features.timeOfDay === 'night') {
      return 0.2; // Higher risk at night
    }
    if (features.hour !== undefined) {
      // Early morning hours (4-6 AM) are higher risk
      if (features.hour >= 4 && features.hour < 6) {
        return 0.3;
      }
    }
    return 0;
  }

  private evaluateMovementPattern(features: Record<string, any>): number {
    // Check for irregular movement patterns
    if (features.movement_variance !== undefined) {
      const variance = features.movement_variance;
      // High variance might indicate instability
      if (variance > 0.8) return 0.4;
      if (variance > 0.6) return 0.2;
    }

    // Check for sudden stops
    if (features.movement_stop_detected === true) {
      return 0.5;
    }

    return 0;
  }

  private calculateConfidence(features: Record<string, any>, riskScore: number): number {
    let confidence = 0.85;

    // Count available features
    const availableFeatures = [
      'activity',
      'heart_rate',
      'heart_rate_variability',
      'steps',
      'accelerometer_magnitude',
      'spo2',
    ].filter((key) => features[key] !== undefined).length;

    // Adjust confidence based on data completeness
    if (availableFeatures >= 5) {
      confidence = 0.92;
    } else if (availableFeatures >= 3) {
      confidence = 0.85;
    } else if (availableFeatures >= 2) {
      confidence = 0.75;
    } else {
      confidence = 0.65;
    }

    // Lower confidence for extreme risk scores (might be outliers)
    if (riskScore > 0.9 && availableFeatures < 4) {
      confidence *= 0.9;
    }

    return Math.min(0.95, Math.max(0.5, confidence));
  }

  private determineSeverity(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore < 0.25) return 'low';
    if (riskScore < 0.45) return 'medium';
    if (riskScore < 0.70) return 'high';
    return 'critical';
  }

  private calculateTimeHorizon(riskScore: number): string {
    if (riskScore >= 0.7) return '5-15 minutes';
    if (riskScore >= 0.5) return '15-30 minutes';
    if (riskScore >= 0.3) return '30-60 minutes';
    return '1-2 hours';
  }

  getVersion(): string {
    return this.modelVersion;
  }
}


