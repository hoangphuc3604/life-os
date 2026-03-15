import { Test, TestingModule } from '@nestjs/testing';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

describe('NotesController', () => {
  let controller: NotesController;
  let service: NotesService;

  const mockUserId = 'user-123';
  const mockNote = {
    id: 'note-1',
    title: 'Test Note',
    icon: '📝',
    cover: null,
    isArchived: false,
    isPublished: false,
    folderId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    blocks: [],
  };

  const mockNotesService = {
    create: jest.fn().mockResolvedValue(mockNote),
    findAll: jest.fn().mockResolvedValue([mockNote]),
    findOne: jest.fn().mockResolvedValue(mockNote),
    update: jest.fn().mockResolvedValue({ ...mockNote, title: 'Updated Note' }),
    remove: jest.fn().mockResolvedValue(undefined),
    move: jest.fn().mockResolvedValue({ ...mockNote, folderId: 'new-folder' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [
        {
          provide: NotesService,
          useValue: mockNotesService,
        },
      ],
    }).compile();

    controller = module.get<NotesController>(NotesController);
    service = module.get<NotesService>(NotesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new note', async () => {
      const req = { user: { userId: mockUserId } } as any;
      const createDto = { title: 'Test Note', addFirstBlock: true };

      const result = await controller.create(req, createDto);

      expect(service.create).toHaveBeenCalledWith(mockUserId, createDto);
      expect(result).toEqual(mockNote);
    });
  });

  describe('findAll', () => {
    it('should return all notes', async () => {
      const req = { user: { userId: mockUserId } } as any;

      const result = await controller.findAll(req);

      expect(service.findAll).toHaveBeenCalledWith(mockUserId, undefined);
      expect(result).toEqual([mockNote]);
    });

    it('should filter notes by folder', async () => {
      const req = { user: { userId: mockUserId } } as any;
      const folderId = 'folder-1';

      const result = await controller.findAll(req, folderId);

      expect(service.findAll).toHaveBeenCalledWith(mockUserId, folderId);
    });
  });

  describe('findOne', () => {
    it('should return a note by id', async () => {
      const req = { user: { userId: mockUserId } } as any;
      const noteId = 'note-1';

      const result = await controller.findOne(req, noteId);

      expect(service.findOne).toHaveBeenCalledWith(mockUserId, noteId);
      expect(result).toEqual(mockNote);
    });
  });

  describe('update', () => {
    it('should update a note', async () => {
      const req = { user: { userId: mockUserId } } as any;
      const noteId = 'note-1';
      const updateDto = { title: 'Updated Note' };

      const result = await controller.update(req, noteId, updateDto);

      expect(service.update).toHaveBeenCalledWith(mockUserId, noteId, updateDto);
      expect(result.title).toBe('Updated Note');
    });
  });

  describe('remove', () => {
    it('should delete a note', async () => {
      const req = { user: { userId: mockUserId } } as any;
      const noteId = 'note-1';

      await controller.remove(req, noteId);

      expect(service.remove).toHaveBeenCalledWith(mockUserId, noteId);
    });
  });

  describe('move', () => {
    it('should move a note', async () => {
      const req = { user: { userId: mockUserId } } as any;
      const noteId = 'note-1';
      const moveDto = { folderId: 'new-folder', position: 0 };

      const result = await controller.move(req, noteId, moveDto);

      expect(service.move).toHaveBeenCalledWith(mockUserId, noteId, moveDto);
      expect(result.folderId).toBe('new-folder');
    });
  });
});
