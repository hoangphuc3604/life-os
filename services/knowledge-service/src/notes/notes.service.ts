import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { MoveNoteDto } from './dto/move-note.dto';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateNoteDto) {
    const maxPosition = await this.prisma.note.aggregate({
      where: { userId, folderId: dto.folderId },
      _max: { position: true },
    });

    const note = await this.prisma.note.create({
      data: {
        userId,
        folderId: dto.folderId,
        title: dto.title || 'Untitled',
        icon: dto.icon,
        cover: dto.cover,
        position: ((maxPosition._max.position ?? -1) + 1),
      },
    });

    if (dto.addFirstBlock) {
      await this.prisma.block.create({
        data: {
          noteId: note.id,
          type: 'paragraph',
          content: { text: '' },
          position: 0,
        },
      });
    }

    return this.findOne(userId, note.id);
  }

  async findAll(userId: string, folderId?: string) {
    const where: any = { userId };
    if (folderId !== undefined) {
      where.folderId = folderId;
    }

    return this.prisma.note.findMany({
      where,
      include: { blocks: { orderBy: { position: 'asc' } } },
      orderBy: [{ position: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async findOne(userId: string, id: string) {
    const note = await this.prisma.note.findFirst({
      where: { id, userId },
      include: { 
        blocks: { 
          orderBy: { position: 'asc' },
          include: { children: { orderBy: { position: 'asc' } } }
        } 
      },
    });

    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async update(userId: string, id: string, dto: UpdateNoteDto) {
    await this.findOne(userId, id);
    return this.prisma.note.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.note.delete({ where: { id } });
  }

  async move(userId: string, id: string, dto: MoveNoteDto) {
    await this.findOne(userId, id);
    return this.prisma.note.update({
      where: { id },
      data: {
        folderId: dto.folderId,
        position: dto.position,
      },
    });
  }
}
