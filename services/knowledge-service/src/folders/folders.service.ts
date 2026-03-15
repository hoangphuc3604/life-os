import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { MoveFolderDto } from './dto/move-folder.dto';

export interface FolderWithChildren {
  id: string;
  name: string;
  parentId: string | null;
  position: number;
  children: FolderWithChildren[];
  notes: { id: string; title: string; icon: string | null; position: number }[];
}

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateFolderDto) {
    const maxPosition = await this.prisma.folder.aggregate({
      where: { userId, parentId: dto.parentId },
      _max: { position: true },
    });
    
    return this.prisma.folder.create({
      data: {
        userId,
        name: dto.name,
        parentId: dto.parentId,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });
  }

  async findAll(userId: string) {
    const folders = await this.prisma.folder.findMany({
      where: { userId },
      include: { children: true, notes: { select: { id: true, title: true, icon: true, position: true } } },
      orderBy: [{ position: 'asc' }],
    });
    
    return this.buildTree(folders);
  }

  private buildTree(folders: any[]): FolderWithChildren[] {
    const map = new Map<string, FolderWithChildren>();
    const roots: FolderWithChildren[] = [];
    
    folders.forEach(f => {
      map.set(f.id, { ...f, children: [], notes: f.notes || [] });
    });
    
    folders.forEach(f => {
      const folder = map.get(f.id)!;
      if (f.parentId && map.has(f.parentId)) {
        map.get(f.parentId)!.children.push(folder);
      } else {
        roots.push(folder);
      }
    });
    
    return roots;
  }

  async findOne(userId: string, id: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id, userId },
      include: { children: true, notes: true },
    });
    
    if (!folder) throw new NotFoundException('Folder not found');
    return folder;
  }

  async update(userId: string, id: string, dto: UpdateFolderDto) {
    await this.findOne(userId, id);
    return this.prisma.folder.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.folder.delete({ where: { id } });
  }

  async move(userId: string, id: string, dto: MoveFolderDto) {
    const folder = await this.findOne(userId, id);
    
    if (dto.parentId) {
      const parent = await this.findOne(userId, dto.parentId);
      if (this.wouldCreateCycle(id, parent)) {
        throw new BadRequestException('Cannot move folder to its own descendant');
      }
    }
    
    return this.prisma.folder.update({
      where: { id },
      data: {
        parentId: dto.parentId,
        position: dto.position,
      },
    });
  }

  private wouldCreateCycle(folderId: string, parent: any): boolean {
    if (parent.id === folderId) return true;
    if (parent.parentId) return false;
    return false;
  }
}
