import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @IsEmail()
  @ApiProperty({ example: 'user@example.com', description: 'Email address associated with the account' })
  email: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'code must be exactly 6 digits' })
  @ApiProperty({ example: '123456', description: 'The 6-digit OTP code' })
  code: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({ example: 'NewSecurePassword123', description: 'New password (min 8 characters)' })
  newPassword: string;
}
