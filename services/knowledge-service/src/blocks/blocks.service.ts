import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { ReorderBlocksDto } from './dto/reorder-blocks.dto';

@Injectable()
export class BlocksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, noteId: string, dto: CreateBlockDto) {
    await this.validateNoteOwnership(userId, noteId);
    
    const maxPosition = await this.prisma.block.aggregate({
      where: { noteId },
      _max: { position: true },
    });

    return this.prisma.block.create({
      data: {
        noteId,
        type: dto.type || 'paragraph',
        content: dto.content || {},
        properties: dto.properties || {},
        position: ((maxPosition._max.position ?? -1) + 1),
        parentId: dto.parentId,
      },
    });
  }

  async findAll(userId: string, noteId: string) {
    await this.validateNoteOwnership(userId, noteId);
    
    return this.prisma.block.findMany({
      where: { noteId },
      orderBy: { position: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const block = await this.prisma.block.findUnique({
      where: { id },
      include: { note: true },
    });
    
    if (!block || block.note.userId !== userId) {
      throw new NotFoundException('Block not found');
    }
    
    return block;
  }

  async update(userId: string, id: string, dto: UpdateBlockDto) {
    await this.findOne(userId, id);
    
    const updateData: any = {};
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.properties !== undefined) updateData.properties = dto.properties;
    if (dto.type !== undefined) updateData.type = dto.type;
    
    return this.prisma.block.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.block.delete({ where: { id } });
  }

  async reorder(userId: string, noteId: string, dto: ReorderBlocksDto) {
    await this.validateNoteOwnership(userId, noteId);
    
    const updates = dto.blocks.map((block, index) =>
      this.prisma.block.update({
        where: { id: block.id },
        data: { position: index },
      })
    );
    
    return this.prisma.$transaction(updates);
  }

  private async validateNoteOwnership(userId: string, noteId: string) {
    const note = await this.prisma.note.findUnique({
      where: { id: noteId },
    });
    
    if (!note || note.userId !== userId) {
      throw new NotFoundException('Note not found');
    }
  }
}
