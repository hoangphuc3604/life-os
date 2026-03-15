import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBlockDto {
  @ApiPropertyOptional({ description: 'Block type' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Block content' })
  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Block properties' })
  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;
}
