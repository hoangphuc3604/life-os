import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFolderDto {
  @ApiPropertyOptional({ description: 'Folder name' })
  @IsOptional()
  @IsString()
  name?: string;
}
