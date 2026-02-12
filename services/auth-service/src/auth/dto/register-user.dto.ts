import { IsEmail, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({ example: 'johndoe', description: 'The username of the user', maxLength: 50 })
  @MaxLength(50)
  username: string;

  @ApiProperty({ example: 'user@example.com', description: 'The email of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'The password of the user', minLength: 8 })
  @MinLength(8)
  password: string;
}
