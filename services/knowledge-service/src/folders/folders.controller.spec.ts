import { Test, TestingModule } from '@nestjs/testing';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';

describe('FoldersController', () => {
  let controller: FoldersController;
  let service: FoldersService;

  const mockUserId = 'user-123';
  const mockFolder = {
    id: 'folder-1',
    name: 'Test Folder',
    parentId: null,
    position: 0,
    children: [],
    notes: [],
  };

  const mockFoldersService = {
    create: jest.fn().mockResolvedValue(mockFolder),
    findAll: jest.fn().mockResolvedValue([mockFolder]),
    findOne: jest.fn().mockResolvedValue(mockFolder),
    update: jest.fn().mockResolvedValue({ ...mockFolder, name: 'Updated Folder' }),
    remove: jest.fn().mockResolvedValue(undefined),
    move: jest.fn().mockResolvedValue({ ...mockFolder, parentId: 'new-parent' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoldersController],
      providers: [
        {
          provide: FoldersService,
          useValue: mockFoldersService,
        },
      ],
    }).compile();

    controller = module.get<FoldersController>(FoldersController);
    service = module.get<FoldersService>(FoldersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new folder', async () => {
      const req = { user: { userId: mockUserId } } as any;
      const createDto = { name: 'Test Folder' };

      const result = await controller.create(req, createDto);

      expect(service.create).toHaveBeenCalledWith(mockUserId, createDto);
      expect(result).toEqual(mockFolder);
    });

    it('should create a subfolder', async () => {
      const req = { user: { userId: mockUserId } } as any;
      const createDto = { name: 'Sub Folder', parentId: 'parent-123' };

      await controller.create(req, createDto);

      expect(service.create).toHaveBeenCalledWith(mockUserId, createDto);
    });
  });

  describe('findAll', () => {
    it('should return all folders as tree', async () => {
      const req = { user: { userId: mockUserId } } as any;

      const result = await controller.findAll(req);

      expect(service.findAll).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual([mockFolder]);
    });
  });

  describe('findOne', () => {
    it('should return a folder by id', async () => {
      const req = { user: { userId: mockUserId } } as any;
      const folderId = 'folder-1';

      const result = await controller.findOne(req, folderId);

      expect(service.findOne).toHaveBeenCalledWith(mockUserId, folderId);
      expect(result).toEqual(mockFolder);
    });
  });

  describe('update', () => {
    it('should update a folder', async () => {
      const req = { user: { userId: mockUserId } } as any;
      const folderId = 'folder-1';
      const updateDto = { name: 'Updated Folder' };

      const result = await controller.update(req, folderId, updateDto);

      expect(service.update).toHaveBeenCalledWith(mockUserId, folderId, updateDto);
      expect(result.name).toBe('Updated Folder');
    });
  });

  describe('remove', () => {
    it('should delete a folder', async () => {
      const req = { user: { userId: mockUserId } } as any;
      const folderId = 'folder-1';

      await controller.remove(req, folderId);

      expect(service.remove).toHaveBeenCalledWith(mockUserId, folderId);
    });
  });

  describe('move', () => {
    it('should move a folder', async () => {
      const req = { user: { userId: mockUserId } } as any;
      const folderId = 'folder-1';
      const moveDto = { parentId: 'new-parent', position: 0 };

      const result = await controller.move(req, folderId, moveDto);

      expect(service.move).toHaveBeenCalledWith(mockUserId, folderId, moveDto);
      expect(result.parentId).toBe('new-parent');
    });
  });
});
