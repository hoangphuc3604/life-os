import { IsString, IsOptional, IsUUID, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBlockDto {
  @ApiPropertyOptional({ description: 'Block type: paragraph, heading, image, code, link, nestedNote' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Block content (JSON based on type)' })
  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Block properties (JSON)' })
  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Parent block ID for nested blocks' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
