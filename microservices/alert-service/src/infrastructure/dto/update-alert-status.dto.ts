import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AlertStatus } from '../../../../../shared/types/common.types';

export class UpdateAlertStatusDto {
  @ApiProperty({
    enum: AlertStatus,
    example: AlertStatus.ACKNOWLEDGED,
  })
  @IsEnum(AlertStatus)
  status: AlertStatus;
}

