import { IsString, IsArray, ValidateNested, IsOptional, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class MetricDto {
  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsNumber()
  value: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  qualityScore?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  timestamp?: string;
}

class LocationDto {
  @ApiProperty()
  @IsNumber()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  longitude: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  accuracy?: number;

  @ApiProperty()
  @IsString()
  source: string;
}

export class CreateTelemetryDto {
  @ApiProperty()
  @IsString()
  deviceId: string;

  @ApiProperty({ type: [MetricDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetricDto)
  metrics: MetricDto[];

  @ApiProperty({ required: false, type: LocationDto })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}

