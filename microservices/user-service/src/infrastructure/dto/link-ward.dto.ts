import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkWardDto {
  @ApiProperty()
  @IsString()
  wardId: string;

  @ApiProperty({ example: 'ward', enum: ['ward', 'parent', 'relative'], required: false })
  @IsEnum(['ward', 'parent', 'relative'])
  @IsOptional()
  relationship?: string;
}

