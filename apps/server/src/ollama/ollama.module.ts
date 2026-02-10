import { Module } from '@nestjs/common';
import { OllamaController } from './ollama.controller';
import { OllamaService } from './services/ollama.service';
import { OllamaClientService } from './services/ollama-client.service';
import { OllamaTranslationService } from './services/ollama-translation.service';
import { OllamaGrammarService } from './services/ollama-grammar.service';
import { OllamaGenerationService } from './services/ollama-generation.service';

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
