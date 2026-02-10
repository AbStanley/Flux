import { Module } from '@nestjs/common';
import { OllamaController } from './ollama.controller';
import { OllamaService } from './ollama.service';
import { OllamaClientService } from './ollama-client.service';
import { OllamaTranslationService } from './ollama-translation.service';
import { OllamaGrammarService } from './ollama-grammar.service';
import { OllamaGenerationService } from './ollama-generation.service';

@Module({
  controllers: [OllamaController],
  providers: [
    OllamaService,
    OllamaClientService,
    OllamaTranslationService,
    OllamaGrammarService,
    OllamaGenerationService,
  ],
  exports: [OllamaService],
})
export class OllamaModule {}
