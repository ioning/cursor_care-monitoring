import { IsString, IsArray, IsObject, IsOptional, ValidateNested, IsNumber, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class MetricDto {
  @ApiProperty({ example: 'heart_rate', description: 'Metric type' })
  @IsString()
  type: string;

  @ApiProperty({ example: 72, description: 'Metric value' })
  @IsNumber()
  value: number;

  @ApiProperty({ example: 'bpm', required: false, description: 'Unit of measurement' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: 0.95, required: false, description: 'Quality score (0-1)' })
  @IsNumber()
  @IsOptional()
  qualityScore?: number;

  @ApiProperty({ example: '2025-12-25T10:30:00.000Z', required: false, description: 'Timestamp' })
  @IsString()
  @IsOptional()
  timestamp?: string;
}

export class LocationDto {
  @ApiProperty({ example: 55.7558, description: 'Latitude' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 37.6173, description: 'Longitude' })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 10, required: false, description: 'Accuracy in meters' })
  @IsNumber()
  @IsOptional()
  accuracy?: number;

  @ApiProperty({ example: 'gps', description: 'Location source' })
  @IsString()
  source: string;
}

export class DeviceTelemetryDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111', description: 'Device ID' })
  @IsUUID()
  deviceId: string;

  @ApiProperty({ type: [MetricDto], description: 'Array of metrics' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetricDto)
  metrics: MetricDto[];

  @ApiProperty({ type: LocationDto, required: false, description: 'Location data' })
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;
}

