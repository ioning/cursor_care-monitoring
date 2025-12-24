import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@care-monitoring/shared/types/common.types';

export class RegisterDto {
  @ApiProperty({ example: 'guardian@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Иванов Иван Иванович' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '+79991234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.GUARDIAN })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ required: false, description: 'Organization ID (auto-assigned if device serial number provided)' })
  @IsString()
  @IsOptional()
  organizationId?: string;

  @ApiProperty({ required: false, description: 'Device serial number for auto-assignment to organization' })
  @IsString()
  @IsOptional()
  deviceSerialNumber?: string;
}

