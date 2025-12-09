import { IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWardDto {
  @ApiProperty({ example: 'Иванов Петр Иванович' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '1990-01-15', required: false })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ example: 'male', enum: ['male', 'female', 'other'], required: false })
  @IsEnum(['male', 'female', 'other'])
  @IsOptional()
  gender?: string;

  @ApiProperty({ example: 'ward', enum: ['ward', 'parent', 'relative'], required: false })
  @IsEnum(['ward', 'parent', 'relative'])
  @IsOptional()
  relationship?: string;

  @ApiProperty({ example: 'Medical conditions, allergies, etc.', required: false })
  @IsString()
  @IsOptional()
  medicalInfo?: string;

  @ApiProperty({ example: 'Emergency contact information', required: false })
  @IsString()
  @IsOptional()
  emergencyContact?: string;
}

