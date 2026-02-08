import { Test, TestingModule } from '@nestjs/testing';
import { WordsService } from './words.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWordDto } from './dto/create-word.dto';

describe('WordsService', () => {
  let service: WordsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WordsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            word: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<WordsService>(WordsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should sanitize text by removing punctuation', async () => {
      const createWordDto: CreateWordDto = {
        text: 'Hello, "World".',
        definition: 'A greeting',
        context: 'Use this when meeting someone.',
      };

      const mockUser = { id: 'user-id', email: 'test@example.com' };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.word.create as jest.Mock).mockResolvedValue({
        id: 'word-id',
        ...createWordDto,
        userId: mockUser.id,
      });

      await service.create(createWordDto);

      expect(prisma.word['create']).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            text: 'Hello World',
            definition: createWordDto.definition,
            context: createWordDto.context,
            userId: mockUser.id,
          }),
          include: { examples: true },
        }),
      );
    });

    it('should sanitize text containing parentheses', async () => {
      const createWordDto: CreateWordDto = {
        text: '(Parentheses)',
        definition: 'A test',
        context: 'Context',
      };

      const mockUser = { id: 'user-id', email: 'test@example.com' };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.word.create as jest.Mock).mockResolvedValue({
        id: 'word-id',
        ...createWordDto,
        userId: mockUser.id,
      });

      await service.create(createWordDto);

      expect(prisma.word['create']).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            text: 'Parentheses',
            definition: createWordDto.definition,
            context: createWordDto.context,
            userId: mockUser.id,
          }),
          include: { examples: true },
        }),
      );
    });

    it('should sanitize injection attempts', async () => {
      const createWordDto: CreateWordDto = {
        text: '<script>alert("XSS")</script>',
        definition: 'Malicious',
        context: 'Context',
      };

      const mockUser = { id: 'user-id', email: 'test@example.com' };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.word.create as jest.Mock).mockResolvedValue({
        id: 'word-id',
        ...createWordDto,
        userId: mockUser.id,
      });

      await service.create(createWordDto);

      // Expect <, >, ", (, ) to be removed.
      // <script>alert("XSS")</script>
      // becomes scriptalertXSSscript
      expect(prisma.word['create']).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            text: 'scriptalertXSSscript',
            definition: createWordDto.definition,
            context: createWordDto.context,
            userId: mockUser.id,
          }),
          include: { examples: true },
        }),
      );
    });

    it('should sanitize SQL injection attempts', async () => {
      const createWordDto: CreateWordDto = {
        text: 'DROP TABLE users;--',
        definition: 'Malicious SQL',
        context: 'Context',
      };

      const mockUser = { id: 'user-id', email: 'test@example.com' };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.word.create as jest.Mock).mockResolvedValue({
        id: 'word-id',
        ...createWordDto,
        userId: mockUser.id,
      });

      await service.create(createWordDto);

      // Expect ; to be removed.
      // DROP TABLE users;-- -> DROP TABLE users--
      expect(prisma.word['create']).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            text: 'DROP TABLE users--',
            definition: createWordDto.definition,
            context: createWordDto.context,
            userId: mockUser.id,
          }),
          include: { examples: true },
        }),
      );
    });
  });
});
