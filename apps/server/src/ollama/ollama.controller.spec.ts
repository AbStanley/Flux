import { Test, TestingModule } from '@nestjs/testing';
// Removed vitest import
import { OllamaController } from './ollama.controller';
import { OllamaService } from './services/ollama.service';

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
      ],
    }).compile();

    controller = module.get<OllamaController>(OllamaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
