import { Module } from '@nestjs/common';
import { OllamaService } from './ollama.service';
import { OllamaController } from './ollama.controller';

@Module({
  providers: [OllamaService],
  controllers: [OllamaController],
})
export class OllamaModule {}
