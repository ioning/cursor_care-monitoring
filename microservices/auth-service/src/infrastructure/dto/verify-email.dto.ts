import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '1234', description: '4-digit verification code' })
  @IsString()
  @Length(4, 4)
  @Matches(/^\d{4}$/, { message: 'Code must be exactly 4 digits' })
  code: string;
}

export class ResendVerificationCodeDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

