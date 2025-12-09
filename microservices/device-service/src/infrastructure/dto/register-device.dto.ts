import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDeviceDto {
  @ApiProperty({ example: 'Smart Watch Pro', description: 'Device name/model' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'smartwatch',
    enum: ['smartwatch', 'bracelet', 'pendant', 'sensor'],
    description: 'Device type',
  })
  @IsEnum(['smartwatch', 'bracelet', 'pendant', 'sensor'])
  deviceType: string;

  @ApiProperty({ example: 'v1.2.3', required: false, description: 'Firmware version' })
  @IsString()
  @IsOptional()
  firmwareVersion?: string;

  @ApiProperty({ example: '00:11:22:33:44:55', required: false, description: 'MAC address' })
  @IsString()
  @IsOptional()
  macAddress?: string;

  @ApiProperty({ example: 'SN123456789', required: false, description: 'Serial number' })
  @IsString()
  @IsOptional()
  serialNumber?: string;
}

