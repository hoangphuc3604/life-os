import { IsArray, ValidateNested, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BlockOrderItem {
  @ApiProperty({ description: 'Block ID' })
  @IsString()
  id: string;
}

export class ReorderBlocksDto {
  @ApiProperty({ description: 'Array of block IDs in new order' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlockOrderItem)
  blocks: BlockOrderItem[];
}
