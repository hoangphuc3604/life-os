import { IsOptional, IsString, IsUUID, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MoveFolderDto {
  @ApiPropertyOptional({ description: 'New parent folder ID' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Position in new parent' })
  @IsOptional()
  @IsNumber()
  position?: number;
}
