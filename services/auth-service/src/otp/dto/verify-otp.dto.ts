import { IsEmail, IsIn, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { type OtpType, OTP_TYPES } from '../../common/types/otp.types';

export class VerifyOtpDto {
  @IsEmail()
  @ApiProperty({ example: 'user@example.com', description: 'Email address associated with the OTP' })
  email: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'code must be exactly 6 digits' })
  @ApiProperty({ example: '123456', description: 'The 6-digit OTP code' })
  code: string;

  @IsIn(OTP_TYPES)
  @ApiProperty({ example: 'register', description: 'Type of OTP request' })
  type: OtpType;
}
