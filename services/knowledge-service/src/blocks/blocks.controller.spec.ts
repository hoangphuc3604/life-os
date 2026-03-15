import { Test, TestingModule } from '@nestjs/testing';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';

describe('BlocksController', () => {
  let controller: BlocksController;
  let service: BlocksService;

  const mockUserId = 'user-123';
  const mockNoteId = 'note-1';
  const mockBlock = {
    id: 'block-1',
    noteId: mockNoteId,
    type: 'paragraph',
    content: { text: 'Hello world' },
    properties: {},
    position: 0,
    parentId: null,
  };

  const mockBlocksService = {
    create: jest.fn().mockResolvedValue(mockBlock),
    findAll: jest.fn().mockResolvedValue([mockBlock]),
    findOne: jest.fn().mockResolvedValue(mockBlock),
    update: jest.fn().mockResolvedValue({ ...mockBlock, content: { text: 'Updated' } }),
    remove: jest.fn().mockResolvedValue(undefined),
    reorder: jest.fn().mockResolvedValue([mockBlock]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlocksController],
      providers: [
        {
          provide: BlocksService,
          useValue: mockBlocksService,
        },
      ],
    }).compile();

    controller = module.get<BlocksController>(BlocksController);
    service = module.get<BlocksService>(BlocksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new block', async () => {
      const req = { user: { userId: mockUserId } } as any;
      const createDto = { type: 'paragraph', content: { text: 'Hello world' } };

      const result = await controller.create(req, mockNoteId, createDto);

      expect(service.create).toHaveBeenCalledWith(mockUserId, mockNoteId, createDto);
      expect(result).toEqual(mockBlock);
    });
  });

  describe('findAll', () => {
    it('should return all blocks for a note', async () => {
      const req = { user: { userId: mockUserId } } as any;

      const result = await controller.findAll(req, mockNoteId);

      expect(service.findAll).toHaveBeenCalledWith(mockUserId, mockNoteId);
      expect(result).toEqual([mockBlock]);
    });
  });

  describe('findOne', () => {
    it('should return a block by id', async () => {
      const req = { user: { userId: mockUserId } } as any;
      const blockId = 'block-1';

      const result = await controller.findOne(req, blockId);

      expect(service.findOne).toHaveBeenCalledWith(mockUserId, blockId);
      expect(result).toEqual(mockBlock);
    });
  });

  describe('update', () => {
    it('should update a block', async () => {
      const req = { user: { userId: mockUserId } } as any;
      const blockId = 'block-1';
      const updateDto = { content: { text: 'Updated' } };

      const result = await controller.update(req, blockId, updateDto);

      expect(service.update).toHaveBeenCalledWith(mockUserId, blockId, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a block', async () => {
      const req = { user: { userId: mockUserId } } as any;
      const blockId = 'block-1';

      await controller.remove(req, blockId);

      expect(service.remove).toHaveBeenCalledWith(mockUserId, blockId);
    });
  });

  describe('reorder', () => {
    it('should reorder blocks', async () => {
      const req = { user: { userId: mockUserId } } as any;
      const reorderDto = { blocks: [{ id: 'block-1' }, { id: 'block-2' }] };

      await controller.reorder(req, mockNoteId, reorderDto);

      expect(service.reorder).toHaveBeenCalledWith(mockUserId, mockNoteId, reorderDto);
    });
  });
});
