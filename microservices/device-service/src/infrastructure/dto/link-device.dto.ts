import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkDeviceDto {
  @ApiProperty()
  @IsString()
  wardId: string;
}

