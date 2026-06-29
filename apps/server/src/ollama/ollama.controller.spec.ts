import { Test, TestingModule } from '@nestjs/testing';
// Removed vitest import
import { OllamaController } from './ollama.controller';
import { OllamaService } from './services/ollama.service';
import { OllamaClientService } from './services/ollama-client.service';
import { DebugTraceService } from './services/debug-trace.service';
import { OllamaModelManagerService } from './services/ollama-model-manager.service';

import { PrismaService } from '../prisma/prisma.service';
import { AiQuotaGuard } from '../auth/guards/ai-quota.guard';

describe('OllamaController', () => {
  let controller: OllamaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OllamaController],
      providers: [
        {
          provide: OllamaService,
          useValue: {},
        },
        {
          provide: OllamaClientService,
          useValue: {},
        },
        {
          provide: OllamaModelManagerService,
          useValue: {},
        },
        {
          provide: DebugTraceService,
          useValue: {},
        },
        {
          provide: PrismaService,
          useValue: {},
        },
        AiQuotaGuard,
      ],
    }).compile();

    controller = module.get<OllamaController>(OllamaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
