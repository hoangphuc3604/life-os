import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { MoveFolderDto } from './dto/move-folder.dto';
import { HeaderAuthGuard } from '../auth/header-auth.guard';
import { Request } from 'express';

@ApiTags('folders')
@ApiBearerAuth()
@UseGuards(HeaderAuthGuard)
@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new folder' })
  create(@Req() req: Request, @Body() createFolderDto: CreateFolderDto) {
    return this.foldersService.create((req as any).user.userId, createFolderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all folders as tree structure' })
  findAll(@Req() req: Request) {
    return this.foldersService.findAll((req as any).user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get folder by ID' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.foldersService.findOne((req as any).user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update folder' })
  update(@Req() req: Request, @Param('id') id: string, @Body() updateFolderDto: UpdateFolderDto) {
    return this.foldersService.update((req as any).user.userId, id, updateFolderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete folder' })
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.foldersService.remove((req as any).user.userId, id);
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Move folder (drag & drop)' })
  move(@Req() req: Request, @Param('id') id: string, @Body() moveFolderDto: MoveFolderDto) {
    return this.foldersService.move((req as any).user.userId, id, moveFolderDto);
  }
}
