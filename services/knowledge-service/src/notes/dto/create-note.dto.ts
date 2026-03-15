import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiPropertyOptional({ description: 'Note title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Parent folder ID' })
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @ApiPropertyOptional({ description: 'Note icon (emoji)' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiPropertyOptional({ description: 'Add first empty block' })
  @IsOptional()
  @IsBoolean()
  addFirstBlock?: boolean;
}
