import { IsString, IsOptional, IsBoolean, IsDateString, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AccessLevel {
  VIEWER = 'viewer',
  EDITOR = 'editor',
  ADMIN = 'admin',
}

export class GrantAccessDto {
  @ApiProperty({ description: 'ID пользователя, которому предоставляется доступ' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ enum: AccessLevel, default: AccessLevel.VIEWER })
  @IsEnum(AccessLevel)
  @IsOptional()
  accessLevel?: AccessLevel;

  @ApiPropertyOptional({ description: 'Права на телеметрию' })
  @IsObject()
  @IsOptional()
  permissions?: {
    canViewTelemetry?: boolean;
    canViewHeartRate?: boolean;
    canViewBloodPressure?: boolean;
    canViewOxygenSaturation?: boolean;
    canViewTemperature?: boolean;
    canViewActivity?: boolean;
    canViewAlerts?: boolean;
    canViewCriticalAlerts?: boolean;
    canViewWarnings?: boolean;
    canViewInfoAlerts?: boolean;
    canManageAlerts?: boolean;
    canViewReports?: boolean;
    canViewWeeklyReports?: boolean;
    canViewCustomReports?: boolean;
    canExportReports?: boolean;
    canViewDevices?: boolean;
    canManageDevices?: boolean;
    canConfigureDevices?: boolean;
    canModifyAlertThresholds?: boolean;
    canManageNotifications?: boolean;
    canViewFinancialInfo?: boolean;
  };

  @ApiPropertyOptional({ description: 'Дата начала доступа (для временного доступа)' })
  @IsDateString()
  @IsOptional()
  accessStartDate?: string;

  @ApiPropertyOptional({ description: 'Дата окончания доступа (для временного доступа)' })
  @IsDateString()
  @IsOptional()
  accessEndDate?: string;

  @ApiPropertyOptional({ description: 'Является ли доступ временным' })
  @IsBoolean()
  @IsOptional()
  isTemporary?: boolean;

  @ApiPropertyOptional({ description: 'Комментарий к предоставлению доступа' })
  @IsString()
  @IsOptional()
  comment?: string;
}


