import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDeviceDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  firmwareVersion?: string;

  @ApiProperty({ enum: ['active', 'inactive', 'maintenance'], required: false })
  @IsEnum(['active', 'inactive', 'maintenance'])
  @IsOptional()
  status?: string;
}

