import { Module } from '@nestjs/common';
import { OllamaController } from './ollama.controller';
import { OllamaService } from './services/ollama.service';
import { OllamaClientService } from './services/ollama-client.service';
import { OllamaTranslationService } from './services/ollama-translation.service';
import { OllamaGrammarService } from './services/ollama-grammar.service';
import { OllamaGenerationService } from './services/ollama-generation.service';
import { OllamaWritingService } from './services/ollama-writing.service';
import { OllamaGateway } from './ollama.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OllamaController],
  providers: [
    OllamaService,
    OllamaClientService,
    OllamaTranslationService,
    OllamaGrammarService,
    OllamaGenerationService,
    OllamaWritingService,
    OllamaGateway,
  ],
  exports: [OllamaService],
})
export class OllamaModule {}
