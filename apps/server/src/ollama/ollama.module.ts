import { Module } from '@nestjs/common';
import { OllamaController } from './ollama.controller';
import { OllamaService } from './services/ollama.service';
import { OllamaClientService } from './services/ollama-client.service';
import { OllamaModelManagerService } from './services/ollama-model-manager.service';
import { OllamaTranslationService } from './services/ollama-translation.service';
import { OllamaGrammarService } from './services/ollama-grammar.service';
import { OllamaGenerationService } from './services/ollama-generation.service';
import { OllamaWritingService } from './services/ollama-writing.service';
import { OllamaGateway } from './ollama.gateway';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DebugTraceService } from './services/debug-trace.service';
import { OpenRouterProviderService } from './services/openrouter-provider.service';
import { GeminiProviderService } from './services/gemini-provider.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [OllamaController],
  providers: [
    OllamaService,
    OllamaClientService,
    OllamaModelManagerService,
    OllamaTranslationService,
    OllamaGrammarService,
    OllamaGenerationService,
    OllamaWritingService,
    OllamaGateway,
    DebugTraceService,
    OpenRouterProviderService,
    GeminiProviderService,
  ],
  exports: [OllamaService, DebugTraceService, OllamaModelManagerService],
})
export class OllamaModule {}
