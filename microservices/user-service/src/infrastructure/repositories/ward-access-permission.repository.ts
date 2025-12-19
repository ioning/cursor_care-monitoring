import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';

export interface WardAccessPermission {
  id: string;
  wardId: string;
  userId: string;
  grantedBy: string;
  accessLevel: 'viewer' | 'editor' | 'admin';
  
  // Телеметрия
  canViewTelemetry: boolean;
  canViewHeartRate: boolean;
  canViewBloodPressure: boolean;
  canViewOxygenSaturation: boolean;
  canViewTemperature: boolean;
  canViewActivity: boolean;
  
  // Алерты
  canViewAlerts: boolean;
  canViewCriticalAlerts: boolean;
  canViewWarnings: boolean;
  canViewInfoAlerts: boolean;
  canManageAlerts: boolean;
  
  // Отчеты
  canViewReports: boolean;
  canViewWeeklyReports: boolean;
  canViewCustomReports: boolean;
  canExportReports: boolean;
  
  // Устройства
  canViewDevices: boolean;
  canManageDevices: boolean;
  canConfigureDevices: boolean;
  
  // Настройки
  canModifyAlertThresholds: boolean;
  canManageNotifications: boolean;
  canViewFinancialInfo: boolean;
  
  // Временные ограничения
  accessStartDate?: Date;
  accessEndDate?: Date;
  isTemporary: boolean;
  
  // Метаданные
  comment?: string;
  status: 'active' | 'revoked' | 'expired';
  createdAt: Date;
  updatedAt: Date;
  revokedAt?: Date;
}

export interface CreateWardAccessPermissionDto {
  wardId: string;
  userId: string;
  grantedBy: string;
  accessLevel?: 'viewer' | 'editor' | 'admin';
  permissions?: Partial<WardAccessPermission>;
  accessStartDate?: Date;
  accessEndDate?: Date;
  isTemporary?: boolean;
  comment?: string;
}

@Injectable()
export class WardAccessPermissionRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS ward_access_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ward_id UUID NOT NULL,
        user_id UUID NOT NULL,
        granted_by UUID NOT NULL,
        access_level VARCHAR(50) DEFAULT 'viewer' CHECK (access_level IN ('viewer', 'editor', 'admin')),
        
        can_view_telemetry BOOLEAN DEFAULT FALSE,
        can_view_heart_rate BOOLEAN DEFAULT FALSE,
        can_view_blood_pressure BOOLEAN DEFAULT FALSE,
        can_view_oxygen_saturation BOOLEAN DEFAULT FALSE,
        can_view_temperature BOOLEAN DEFAULT FALSE,
        can_view_activity BOOLEAN DEFAULT FALSE,
        
        can_view_alerts BOOLEAN DEFAULT FALSE,
        can_view_critical_alerts BOOLEAN DEFAULT FALSE,
        can_view_warnings BOOLEAN DEFAULT FALSE,
        can_view_info_alerts BOOLEAN DEFAULT FALSE,
        can_manage_alerts BOOLEAN DEFAULT FALSE,
        
        can_view_reports BOOLEAN DEFAULT FALSE,
        can_view_weekly_reports BOOLEAN DEFAULT FALSE,
        can_view_custom_reports BOOLEAN DEFAULT FALSE,
        can_export_reports BOOLEAN DEFAULT FALSE,
        
        can_view_devices BOOLEAN DEFAULT FALSE,
        can_manage_devices BOOLEAN DEFAULT FALSE,
        can_configure_devices BOOLEAN DEFAULT FALSE,
        
        can_modify_alert_thresholds BOOLEAN DEFAULT FALSE,
        can_manage_notifications BOOLEAN DEFAULT FALSE,
        can_view_financial_info BOOLEAN DEFAULT FALSE,
        
        access_start_date TIMESTAMPTZ,
        access_end_date TIMESTAMPTZ,
        is_temporary BOOLEAN DEFAULT FALSE,
        
        comment TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        revoked_at TIMESTAMPTZ,
        
        UNIQUE(ward_id, user_id)
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_ward_access_permissions_ward ON ward_access_permissions(ward_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_ward_access_permissions_user ON ward_access_permissions(user_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_ward_access_permissions_status ON ward_access_permissions(status)
    `);
  }

  async create(data: CreateWardAccessPermissionDto): Promise<WardAccessPermission> {
    const db = getDatabaseConnection();
    const permissions = data.permissions || {};
    
    const result = await db.query(
      `INSERT INTO ward_access_permissions (
        ward_id, user_id, granted_by, access_level,
        can_view_telemetry, can_view_heart_rate, can_view_blood_pressure,
        can_view_oxygen_saturation, can_view_temperature, can_view_activity,
        can_view_alerts, can_view_critical_alerts, can_view_warnings,
        can_view_info_alerts, can_manage_alerts,
        can_view_reports, can_view_weekly_reports, can_view_custom_reports,
        can_export_reports,
        can_view_devices, can_manage_devices, can_configure_devices,
        can_modify_alert_thresholds, can_manage_notifications, can_view_financial_info,
        access_start_date, access_end_date, is_temporary, comment
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19,
        $20, $21, $22,
        $23, $24, $25,
        $26, $27, $28, $29
      ) RETURNING *`,
      [
        data.wardId,
        data.userId,
        data.grantedBy,
        data.accessLevel || 'viewer',
        permissions.canViewTelemetry ?? false,
        permissions.canViewHeartRate ?? false,
        permissions.canViewBloodPressure ?? false,
        permissions.canViewOxygenSaturation ?? false,
        permissions.canViewTemperature ?? false,
        permissions.canViewActivity ?? false,
        permissions.canViewAlerts ?? false,
        permissions.canViewCriticalAlerts ?? false,
        permissions.canViewWarnings ?? false,
        permissions.canViewInfoAlerts ?? false,
        permissions.canManageAlerts ?? false,
        permissions.canViewReports ?? false,
        permissions.canViewWeeklyReports ?? false,
        permissions.canViewCustomReports ?? false,
        permissions.canExportReports ?? false,
        permissions.canViewDevices ?? false,
        permissions.canManageDevices ?? false,
        permissions.canConfigureDevices ?? false,
        permissions.canModifyAlertThresholds ?? false,
        permissions.canManageNotifications ?? false,
        permissions.canViewFinancialInfo ?? false,
        data.accessStartDate || null,
        data.accessEndDate || null,
        data.isTemporary ?? false,
        data.comment || null,
      ],
    );
    
    return this.mapRowToPermission(result.rows[0]);
  }

  async findByWardId(wardId: string): Promise<WardAccessPermission[]> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT * FROM ward_access_permissions 
       WHERE ward_id = $1 AND status = 'active'
       ORDER BY created_at DESC`,
      [wardId],
    );
    return result.rows.map(row => this.mapRowToPermission(row));
  }

  async findByUserId(userId: string): Promise<WardAccessPermission[]> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT * FROM ward_access_permissions 
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows.map(row => this.mapRowToPermission(row));
  }

  async findById(id: string): Promise<WardAccessPermission | null> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT * FROM ward_access_permissions WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToPermission(result.rows[0]);
  }

  async findByWardAndUser(wardId: string, userId: string): Promise<WardAccessPermission | null> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT * FROM ward_access_permissions 
       WHERE ward_id = $1 AND user_id = $2 AND status = 'active'`,
      [wardId, userId],
    );
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToPermission(result.rows[0]);
  }

  async update(id: string, updates: Partial<WardAccessPermission>): Promise<WardAccessPermission> {
    const db = getDatabaseConnection();
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    (Object.keys(updates) as (keyof WardAccessPermission)[]).forEach((key) => {
      if (key !== 'id' && updates[key] !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(updates[key] as any);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query(
      `UPDATE ward_access_permissions 
       SET ${fields.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING *`,
      values,
    );

    return this.mapRowToPermission(result.rows[0]);
  }

  async revoke(id: string): Promise<void> {
    const db = getDatabaseConnection();
    await db.query(
      `UPDATE ward_access_permissions 
       SET status = 'revoked', revoked_at = NOW(), updated_at = NOW() 
       WHERE id = $1`,
      [id],
    );
  }

  async checkExpiredPermissions(): Promise<void> {
    const db = getDatabaseConnection();
    await db.query(
      `UPDATE ward_access_permissions 
       SET status = 'expired', updated_at = NOW() 
       WHERE is_temporary = TRUE 
         AND access_end_date IS NOT NULL 
         AND access_end_date < NOW() 
         AND status = 'active'`,
    );
  }

  private mapRowToPermission(row: any): WardAccessPermission {
    return {
      id: row.id,
      wardId: row.ward_id,
      userId: row.user_id,
      grantedBy: row.granted_by,
      accessLevel: row.access_level,
      canViewTelemetry: row.can_view_telemetry,
      canViewHeartRate: row.can_view_heart_rate,
      canViewBloodPressure: row.can_view_blood_pressure,
      canViewOxygenSaturation: row.can_view_oxygen_saturation,
      canViewTemperature: row.can_view_temperature,
      canViewActivity: row.can_view_activity,
      canViewAlerts: row.can_view_alerts,
      canViewCriticalAlerts: row.can_view_critical_alerts,
      canViewWarnings: row.can_view_warnings,
      canViewInfoAlerts: row.can_view_info_alerts,
      canManageAlerts: row.can_manage_alerts,
      canViewReports: row.can_view_reports,
      canViewWeeklyReports: row.can_view_weekly_reports,
      canViewCustomReports: row.can_view_custom_reports,
      canExportReports: row.can_export_reports,
      canViewDevices: row.can_view_devices,
      canManageDevices: row.can_manage_devices,
      canConfigureDevices: row.can_configure_devices,
      canModifyAlertThresholds: row.can_modify_alert_thresholds,
      canManageNotifications: row.can_manage_notifications,
      canViewFinancialInfo: row.can_view_financial_info,
      accessStartDate: row.access_start_date,
      accessEndDate: row.access_end_date,
      isTemporary: row.is_temporary,
      comment: row.comment,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      revokedAt: row.revoked_at,
    };
  }
}

