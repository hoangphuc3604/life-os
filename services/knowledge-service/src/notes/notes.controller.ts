import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { MoveNoteDto } from './dto/move-note.dto';
import { HeaderAuthGuard } from '../auth/header-auth.guard';
import { Request } from 'express';

@ApiTags('notes')
@ApiBearerAuth()
@UseGuards(HeaderAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  create(@Req() req: Request, @Body() createNoteDto: CreateNoteDto) {
    return this.notesService.create((req as any).user.userId, createNoteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notes (with optional folder filter)' })
  @ApiQuery({ name: 'folderId', required: false })
  findAll(@Req() req: Request, @Query('folderId') folderId?: string) {
    return this.notesService.findAll((req as any).user.userId, folderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get note by ID with blocks' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    return this.notesService.findOne((req as any).user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update note' })
  update(@Req() req: Request, @Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto) {
    return this.notesService.update((req as any).user.userId, id, updateNoteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete note' })
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.notesService.remove((req as any).user.userId, id);
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Move note (drag & drop)' })
  move(@Req() req: Request, @Param('id') id: string, @Body() moveNoteDto: MoveNoteDto) {
    return this.notesService.move((req as any).user.userId, id, moveNoteDto);
  }
}
