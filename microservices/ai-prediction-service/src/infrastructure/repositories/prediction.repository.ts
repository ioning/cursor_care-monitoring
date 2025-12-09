import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../shared/libs/database';

export interface PredictionRecord {
  id: string;
  wardId: string;
  modelId: string;
  predictionType: string;
  inputFeatures: Record<string, any>;
  output: any;
  confidence: number;
  timestamp: Date;
  createdAt: Date;
}

export interface PredictionStats {
  total: number;
  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  averageRiskScore: number;
  averageConfidence: number;
  highRiskCount: number;
  recentTrend: 'increasing' | 'decreasing' | 'stable';
}

@Injectable()
export class PredictionRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS predictions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ward_id UUID NOT NULL,
        model_id VARCHAR(100) NOT NULL,
        prediction_type VARCHAR(50) NOT NULL,
        input_features JSONB NOT NULL,
        output_prediction JSONB NOT NULL,
        confidence DECIMAL(5,3),
        risk_score DECIMAL(5,3),
        severity VARCHAR(20),
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create indexes for better query performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_ward_type 
      ON predictions(ward_id, prediction_type)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_ward_timestamp 
      ON predictions(ward_id, timestamp DESC)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_severity 
      ON predictions(severity)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_risk_score 
      ON predictions(risk_score DESC)
    `);

    // Составные индексы для частых запросов
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_ward_type_timestamp 
      ON predictions(ward_id, prediction_type, timestamp DESC)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_ward_severity_timestamp 
      ON predictions(ward_id, severity, timestamp DESC)
    `);

    // GIN индексы для JSONB полей (для поиска внутри JSON)
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_input_features_gin 
      ON predictions USING GIN (input_features)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_output_gin 
      ON predictions USING GIN (output_prediction)
    `);

    // Частичный индекс для высоких рисков
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_high_risk 
      ON predictions(ward_id, timestamp DESC) 
      WHERE risk_score >= 0.7
    `);
  }

  async save(data: {
    id: string;
    wardId: string;
    modelId: string;
    predictionType: string;
    inputFeatures: Record<string, any>;
    output: any;
    timestamp: Date;
  }): Promise<void> {
    const db = getDatabaseConnection();
    await db.query(
      `INSERT INTO predictions (id, ward_id, model_id, prediction_type, input_features, output_prediction, confidence, risk_score, severity, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        data.id,
        data.wardId,
        data.modelId,
        data.predictionType,
        JSON.stringify(data.inputFeatures),
        JSON.stringify(data.output),
        data.output.confidence || null,
        data.output.riskScore || null,
        data.output.severity || null,
        data.timestamp,
      ],
    );
  }

  async findByWard(
    wardId: string,
    options?: {
      type?: string;
      from?: Date;
      to?: Date;
      limit?: number;
    },
  ): Promise<PredictionRecord[]> {
    const db = getDatabaseConnection();
    const limit = options?.limit || 100;
    const conditions: string[] = ['ward_id = $1'];
    const params: any[] = [wardId];
    let paramIndex = 2;

    if (options?.type) {
      conditions.push(`prediction_type = $${paramIndex}`);
      params.push(options.type);
      paramIndex++;
    }

    if (options?.from) {
      conditions.push(`timestamp >= $${paramIndex}`);
      params.push(options.from);
      paramIndex++;
    }

    if (options?.to) {
      conditions.push(`timestamp <= $${paramIndex}`);
      params.push(options.to);
      paramIndex++;
    }

    params.push(limit);

    const query = `
      SELECT 
        id,
        ward_id as "wardId",
        model_id as "modelId",
        prediction_type as "predictionType",
        input_features as "inputFeatures",
        output_prediction as "output",
        confidence,
        timestamp,
        created_at as "createdAt"
      FROM predictions
      WHERE ${conditions.join(' AND ')}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex}
    `;

    const result = await db.query(query, params);
    return result.rows.map((row) => ({
      ...row,
      inputFeatures: typeof row.inputFeatures === 'string' ? JSON.parse(row.inputFeatures) : row.inputFeatures,
      output: typeof row.output === 'string' ? JSON.parse(row.output) : row.output,
    }));
  }

  async getStats(wardId: string, days: number = 7): Promise<PredictionStats> {
    const db = getDatabaseConnection();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Get total count and averages
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        AVG(risk_score) as avg_risk_score,
        AVG(confidence) as avg_confidence,
        COUNT(CASE WHEN risk_score >= 0.7 THEN 1 END) as high_risk_count
      FROM predictions
      WHERE ward_id = $1 AND timestamp >= $2
    `;

    const statsResult = await db.query(statsQuery, [wardId, fromDate]);
    const stats = statsResult.rows[0];

    // Get severity breakdown
    const severityQuery = `
      SELECT 
        severity,
        COUNT(*) as count
      FROM predictions
      WHERE ward_id = $1 AND timestamp >= $2
      GROUP BY severity
    `;

    const severityResult = await db.query(severityQuery, [wardId, fromDate]);
    const severityMap: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    severityResult.rows.forEach((row) => {
      if (row.severity && severityMap.hasOwnProperty(row.severity)) {
        severityMap[row.severity] = parseInt(row.count, 10);
      }
    });

    // Calculate trend (compare first half vs second half of period)
    const trendQuery = `
      WITH period_data AS (
        SELECT 
          risk_score,
          CASE 
            WHEN timestamp < $3 THEN 'first_half'
            ELSE 'second_half'
          END as period
        FROM predictions
        WHERE ward_id = $1 AND timestamp >= $2
      )
      SELECT 
        period,
        AVG(risk_score) as avg_risk
      FROM period_data
      GROUP BY period
    `;

    const midDate = new Date(fromDate.getTime() + (Date.now() - fromDate.getTime()) / 2);
    const trendResult = await db.query(trendQuery, [wardId, fromDate, midDate]);

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (trendResult.rows.length === 2) {
      const firstHalf = trendResult.rows.find((r) => r.period === 'first_half');
      const secondHalf = trendResult.rows.find((r) => r.period === 'second_half');
      if (firstHalf && secondHalf) {
        const diff = parseFloat(secondHalf.avg_risk) - parseFloat(firstHalf.avg_risk);
        if (diff > 0.05) {
          trend = 'increasing';
        } else if (diff < -0.05) {
          trend = 'decreasing';
        }
      }
    }

    return {
      total: parseInt(stats.total, 10) || 0,
      bySeverity: {
        low: severityMap.low,
        medium: severityMap.medium,
        high: severityMap.high,
        critical: severityMap.critical,
      },
      averageRiskScore: parseFloat(stats.avg_risk_score) || 0,
      averageConfidence: parseFloat(stats.avg_confidence) || 0,
      highRiskCount: parseInt(stats.high_risk_count, 10) || 0,
      recentTrend: trend,
    };
  }

  async findById(id: string): Promise<PredictionRecord | null> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `
      SELECT 
        id,
        ward_id as "wardId",
        model_id as "modelId",
        prediction_type as "predictionType",
        input_features as "inputFeatures",
        output_prediction as "output",
        confidence,
        timestamp,
        created_at as "createdAt"
      FROM predictions
      WHERE id = $1
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      inputFeatures: typeof row.inputFeatures === 'string' ? JSON.parse(row.inputFeatures) : row.inputFeatures,
      output: typeof row.output === 'string' ? JSON.parse(row.output) : row.output,
    };
  }

  async deleteOldPredictions(daysToKeep: number = 90): Promise<number> {
    const db = getDatabaseConnection();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db.query(
      `DELETE FROM predictions WHERE timestamp < $1 RETURNING id`,
      [cutoffDate],
    );

    return result.rowCount || 0;
  }
}


    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_ward_timestamp 
      ON predictions(ward_id, timestamp DESC)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_severity 
      ON predictions(severity)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_risk_score 
      ON predictions(risk_score DESC)
    `);

    // Составные индексы для частых запросов
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_ward_type_timestamp 
      ON predictions(ward_id, prediction_type, timestamp DESC)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_ward_severity_timestamp 
      ON predictions(ward_id, severity, timestamp DESC)
    `);

    // GIN индексы для JSONB полей (для поиска внутри JSON)
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_input_features_gin 
      ON predictions USING GIN (input_features)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_output_gin 
      ON predictions USING GIN (output_prediction)
    `);

    // Частичный индекс для высоких рисков
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_high_risk 
      ON predictions(ward_id, timestamp DESC) 
      WHERE risk_score >= 0.7
    `);
  }

  async save(data: {
    id: string;
    wardId: string;
    modelId: string;
    predictionType: string;
    inputFeatures: Record<string, any>;
    output: any;
    timestamp: Date;
  }): Promise<void> {
    const db = getDatabaseConnection();
    await db.query(
      `INSERT INTO predictions (id, ward_id, model_id, prediction_type, input_features, output_prediction, confidence, risk_score, severity, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        data.id,
        data.wardId,
        data.modelId,
        data.predictionType,
        JSON.stringify(data.inputFeatures),
        JSON.stringify(data.output),
        data.output.confidence || null,
        data.output.riskScore || null,
        data.output.severity || null,
        data.timestamp,
      ],
    );
  }

  async findByWard(
    wardId: string,
    options?: {
      type?: string;
      from?: Date;
      to?: Date;
      limit?: number;
    },
  ): Promise<PredictionRecord[]> {
    const db = getDatabaseConnection();
    const limit = options?.limit || 100;
    const conditions: string[] = ['ward_id = $1'];
    const params: any[] = [wardId];
    let paramIndex = 2;

    if (options?.type) {
      conditions.push(`prediction_type = $${paramIndex}`);
      params.push(options.type);
      paramIndex++;
    }

    if (options?.from) {
      conditions.push(`timestamp >= $${paramIndex}`);
      params.push(options.from);
      paramIndex++;
    }

    if (options?.to) {
      conditions.push(`timestamp <= $${paramIndex}`);
      params.push(options.to);
      paramIndex++;
    }

    params.push(limit);

    const query = `
      SELECT 
        id,
        ward_id as "wardId",
        model_id as "modelId",
        prediction_type as "predictionType",
        input_features as "inputFeatures",
        output_prediction as "output",
        confidence,
        timestamp,
        created_at as "createdAt"
      FROM predictions
      WHERE ${conditions.join(' AND ')}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex}
    `;

    const result = await db.query(query, params);
    return result.rows.map((row) => ({
      ...row,
      inputFeatures: typeof row.inputFeatures === 'string' ? JSON.parse(row.inputFeatures) : row.inputFeatures,
      output: typeof row.output === 'string' ? JSON.parse(row.output) : row.output,
    }));
  }

  async getStats(wardId: string, days: number = 7): Promise<PredictionStats> {
    const db = getDatabaseConnection();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Get total count and averages
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        AVG(risk_score) as avg_risk_score,
        AVG(confidence) as avg_confidence,
        COUNT(CASE WHEN risk_score >= 0.7 THEN 1 END) as high_risk_count
      FROM predictions
      WHERE ward_id = $1 AND timestamp >= $2
    `;

    const statsResult = await db.query(statsQuery, [wardId, fromDate]);
    const stats = statsResult.rows[0];

    // Get severity breakdown
    const severityQuery = `
      SELECT 
        severity,
        COUNT(*) as count
      FROM predictions
      WHERE ward_id = $1 AND timestamp >= $2
      GROUP BY severity
    `;

    const severityResult = await db.query(severityQuery, [wardId, fromDate]);
    const severityMap: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    severityResult.rows.forEach((row) => {
      if (row.severity && severityMap.hasOwnProperty(row.severity)) {
        severityMap[row.severity] = parseInt(row.count, 10);
      }
    });

    // Calculate trend (compare first half vs second half of period)
    const trendQuery = `
      WITH period_data AS (
        SELECT 
          risk_score,
          CASE 
            WHEN timestamp < $3 THEN 'first_half'
            ELSE 'second_half'
          END as period
        FROM predictions
        WHERE ward_id = $1 AND timestamp >= $2
      )
      SELECT 
        period,
        AVG(risk_score) as avg_risk
      FROM period_data
      GROUP BY period
    `;

    const midDate = new Date(fromDate.getTime() + (Date.now() - fromDate.getTime()) / 2);
    const trendResult = await db.query(trendQuery, [wardId, fromDate, midDate]);

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (trendResult.rows.length === 2) {
      const firstHalf = trendResult.rows.find((r) => r.period === 'first_half');
      const secondHalf = trendResult.rows.find((r) => r.period === 'second_half');
      if (firstHalf && secondHalf) {
        const diff = parseFloat(secondHalf.avg_risk) - parseFloat(firstHalf.avg_risk);
        if (diff > 0.05) {
          trend = 'increasing';
        } else if (diff < -0.05) {
          trend = 'decreasing';
        }
      }
    }

    return {
      total: parseInt(stats.total, 10) || 0,
      bySeverity: {
        low: severityMap.low,
        medium: severityMap.medium,
        high: severityMap.high,
        critical: severityMap.critical,
      },
      averageRiskScore: parseFloat(stats.avg_risk_score) || 0,
      averageConfidence: parseFloat(stats.avg_confidence) || 0,
      highRiskCount: parseInt(stats.high_risk_count, 10) || 0,
      recentTrend: trend,
    };
  }

  async findById(id: string): Promise<PredictionRecord | null> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `
      SELECT 
        id,
        ward_id as "wardId",
        model_id as "modelId",
        prediction_type as "predictionType",
        input_features as "inputFeatures",
        output_prediction as "output",
        confidence,
        timestamp,
        created_at as "createdAt"
      FROM predictions
      WHERE id = $1
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      inputFeatures: typeof row.inputFeatures === 'string' ? JSON.parse(row.inputFeatures) : row.inputFeatures,
      output: typeof row.output === 'string' ? JSON.parse(row.output) : row.output,
    };
  }

  async deleteOldPredictions(daysToKeep: number = 90): Promise<number> {
    const db = getDatabaseConnection();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db.query(
      `DELETE FROM predictions WHERE timestamp < $1 RETURNING id`,
      [cutoffDate],
    );

    return result.rowCount || 0;
  }
}


    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_ward_timestamp 
      ON predictions(ward_id, timestamp DESC)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_severity 
      ON predictions(severity)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_risk_score 
      ON predictions(risk_score DESC)
    `);

    // Составные индексы для частых запросов
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_ward_type_timestamp 
      ON predictions(ward_id, prediction_type, timestamp DESC)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_ward_severity_timestamp 
      ON predictions(ward_id, severity, timestamp DESC)
    `);

    // GIN индексы для JSONB полей (для поиска внутри JSON)
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_input_features_gin 
      ON predictions USING GIN (input_features)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_output_gin 
      ON predictions USING GIN (output_prediction)
    `);

    // Частичный индекс для высоких рисков
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_predictions_high_risk 
      ON predictions(ward_id, timestamp DESC) 
      WHERE risk_score >= 0.7
    `);
  }

  async save(data: {
    id: string;
    wardId: string;
    modelId: string;
    predictionType: string;
    inputFeatures: Record<string, any>;
    output: any;
    timestamp: Date;
  }): Promise<void> {
    const db = getDatabaseConnection();
    await db.query(
      `INSERT INTO predictions (id, ward_id, model_id, prediction_type, input_features, output_prediction, confidence, risk_score, severity, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        data.id,
        data.wardId,
        data.modelId,
        data.predictionType,
        JSON.stringify(data.inputFeatures),
        JSON.stringify(data.output),
        data.output.confidence || null,
        data.output.riskScore || null,
        data.output.severity || null,
        data.timestamp,
      ],
    );
  }

  async findByWard(
    wardId: string,
    options?: {
      type?: string;
      from?: Date;
      to?: Date;
      limit?: number;
    },
  ): Promise<PredictionRecord[]> {
    const db = getDatabaseConnection();
    const limit = options?.limit || 100;
    const conditions: string[] = ['ward_id = $1'];
    const params: any[] = [wardId];
    let paramIndex = 2;

    if (options?.type) {
      conditions.push(`prediction_type = $${paramIndex}`);
      params.push(options.type);
      paramIndex++;
    }

    if (options?.from) {
      conditions.push(`timestamp >= $${paramIndex}`);
      params.push(options.from);
      paramIndex++;
    }

    if (options?.to) {
      conditions.push(`timestamp <= $${paramIndex}`);
      params.push(options.to);
      paramIndex++;
    }

    params.push(limit);

    const query = `
      SELECT 
        id,
        ward_id as "wardId",
        model_id as "modelId",
        prediction_type as "predictionType",
        input_features as "inputFeatures",
        output_prediction as "output",
        confidence,
        timestamp,
        created_at as "createdAt"
      FROM predictions
      WHERE ${conditions.join(' AND ')}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex}
    `;

    const result = await db.query(query, params);
    return result.rows.map((row) => ({
      ...row,
      inputFeatures: typeof row.inputFeatures === 'string' ? JSON.parse(row.inputFeatures) : row.inputFeatures,
      output: typeof row.output === 'string' ? JSON.parse(row.output) : row.output,
    }));
  }

  async getStats(wardId: string, days: number = 7): Promise<PredictionStats> {
    const db = getDatabaseConnection();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Get total count and averages
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        AVG(risk_score) as avg_risk_score,
        AVG(confidence) as avg_confidence,
        COUNT(CASE WHEN risk_score >= 0.7 THEN 1 END) as high_risk_count
      FROM predictions
      WHERE ward_id = $1 AND timestamp >= $2
    `;

    const statsResult = await db.query(statsQuery, [wardId, fromDate]);
    const stats = statsResult.rows[0];

    // Get severity breakdown
    const severityQuery = `
      SELECT 
        severity,
        COUNT(*) as count
      FROM predictions
      WHERE ward_id = $1 AND timestamp >= $2
      GROUP BY severity
    `;

    const severityResult = await db.query(severityQuery, [wardId, fromDate]);
    const severityMap: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    severityResult.rows.forEach((row) => {
      if (row.severity && severityMap.hasOwnProperty(row.severity)) {
        severityMap[row.severity] = parseInt(row.count, 10);
      }
    });

    // Calculate trend (compare first half vs second half of period)
    const trendQuery = `
      WITH period_data AS (
        SELECT 
          risk_score,
          CASE 
            WHEN timestamp < $3 THEN 'first_half'
            ELSE 'second_half'
          END as period
        FROM predictions
        WHERE ward_id = $1 AND timestamp >= $2
      )
      SELECT 
        period,
        AVG(risk_score) as avg_risk
      FROM period_data
      GROUP BY period
    `;

    const midDate = new Date(fromDate.getTime() + (Date.now() - fromDate.getTime()) / 2);
    const trendResult = await db.query(trendQuery, [wardId, fromDate, midDate]);

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (trendResult.rows.length === 2) {
      const firstHalf = trendResult.rows.find((r) => r.period === 'first_half');
      const secondHalf = trendResult.rows.find((r) => r.period === 'second_half');
      if (firstHalf && secondHalf) {
        const diff = parseFloat(secondHalf.avg_risk) - parseFloat(firstHalf.avg_risk);
        if (diff > 0.05) {
          trend = 'increasing';
        } else if (diff < -0.05) {
          trend = 'decreasing';
        }
      }
    }

    return {
      total: parseInt(stats.total, 10) || 0,
      bySeverity: {
        low: severityMap.low,
        medium: severityMap.medium,
        high: severityMap.high,
        critical: severityMap.critical,
      },
      averageRiskScore: parseFloat(stats.avg_risk_score) || 0,
      averageConfidence: parseFloat(stats.avg_confidence) || 0,
      highRiskCount: parseInt(stats.high_risk_count, 10) || 0,
      recentTrend: trend,
    };
  }

  async findById(id: string): Promise<PredictionRecord | null> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `
      SELECT 
        id,
        ward_id as "wardId",
        model_id as "modelId",
        prediction_type as "predictionType",
        input_features as "inputFeatures",
        output_prediction as "output",
        confidence,
        timestamp,
        created_at as "createdAt"
      FROM predictions
      WHERE id = $1
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      inputFeatures: typeof row.inputFeatures === 'string' ? JSON.parse(row.inputFeatures) : row.inputFeatures,
      output: typeof row.output === 'string' ? JSON.parse(row.output) : row.output,
    };
  }

  async deleteOldPredictions(daysToKeep: number = 90): Promise<number> {
    const db = getDatabaseConnection();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db.query(
      `DELETE FROM predictions WHERE timestamp < $1 RETURNING id`,
      [cutoffDate],
    );

    return result.rowCount || 0;
  }
}

