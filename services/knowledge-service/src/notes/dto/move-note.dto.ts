import { IsOptional, IsUUID, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MoveNoteDto {
  @ApiPropertyOptional({ description: 'New parent folder ID' })
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @ApiPropertyOptional({ description: 'Position in new parent' })
  @IsOptional()
  @IsNumber()
  position?: number;
}
