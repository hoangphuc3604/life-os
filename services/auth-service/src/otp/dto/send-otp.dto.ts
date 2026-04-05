import { IsEmail, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { type OtpType, OTP_TYPES } from '../../common/types/otp.types';

export class SendOtpDto {
  @IsEmail()
  @ApiProperty({ example: 'user@example.com', description: 'Email address to send OTP to' })
  email: string;

  @IsOptional()
  @IsIn(OTP_TYPES)
  @ApiProperty({ example: 'register', required: false, description: 'Type of OTP request' })
  type?: OtpType;
}
