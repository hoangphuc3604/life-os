import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { ReorderBlocksDto } from './dto/reorder-blocks.dto';
import { HeaderAuthGuard } from '../auth/header-auth.guard';
import { Request } from 'express';

@ApiTags('blocks')
@ApiBearerAuth()
@UseGuards(HeaderAuthGuard)
@Controller()
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post('notes/:noteId/blocks')
  @ApiOperation({ summary: 'Create a new block in a note' })
  create(@Req() req: Request, @Param('noteId') noteId: string, @Body() createBlockDto: CreateBlockDto) {
    return this.blocksService.create((req as any).user.userId, noteId, createBlockDto);
  }

  @Get('notes/:noteId/blocks')
  @ApiOperation({ summary: 'Get all blocks in a note' })
  findAll(@Req() req: Request, @Param('noteId') noteId: string) {
    return this.blocksService.findAll((req as any).user.userId, noteId);
  }

  @Get('blocks/:id')
  @ApiOperation({ summary: 'Get block by ID' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.blocksService.findOne((req as any).user.userId, id);
  }

  @Patch('blocks/:id')
  @ApiOperation({ summary: 'Update block' })
  update(@Req() req: Request, @Param('id') id: string, @Body() updateBlockDto: UpdateBlockDto) {
    return this.blocksService.update((req as any).user.userId, id, updateBlockDto);
  }

  @Delete('blocks/:id')
  @ApiOperation({ summary: 'Delete block' })
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.blocksService.remove((req as any).user.userId, id);
  }

  @Patch('notes/:noteId/blocks/reorder')
  @ApiOperation({ summary: 'Reorder blocks in a note' })
  reorder(@Req() req: Request, @Param('noteId') noteId: string, @Body() reorderBlocksDto: ReorderBlocksDto) {
    return this.blocksService.reorder((req as any).user.userId, noteId, reorderBlocksDto);
  }
}
