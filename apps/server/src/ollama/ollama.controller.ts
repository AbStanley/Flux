import { Body, Controller, Post, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  OllamaService,
  GrammarAnalysisResponse,
  RichTranslation,
  OllamaMessage,
} from './ollama.service';
import { GenerateContentDto } from './dto/generate-content.dto';

@Controller('api')
export class OllamaController {
  constructor(private readonly ollamaService: OllamaService) {}

  @Post('chat')
  async chat(
    @Body()
    body: { model: string; messages: OllamaMessage[]; stream?: boolean },
    @Res() res: Response,
  ) {
    if (body.stream) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      const stream = (await this.ollamaService.chat(
        body.model,
        body.messages,
        true,
      )) as AsyncIterable<unknown>;
      for await (const part of stream) {
        res.write(JSON.stringify(part) + '\n');
      }
      res.end();
    } else {
      const response = await this.ollamaService.chat(
        body.model,
        body.messages,
        false,
      );
      res.json(response);
    }
  }

  @Post('generate')
  async generate(
    @Body() body: { model: string; prompt: string; stream?: boolean },
    @Res() res: Response,
  ) {
    if (body.stream) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      const stream = (await this.ollamaService.generate(
        body.model,
        body.prompt,
        true,
      )) as AsyncIterable<unknown>;
      for await (const part of stream) {
        res.write(JSON.stringify(part) + '\n');
      }
      res.end();
    } else {
      const response = await this.ollamaService.generate(
        body.model,
        body.prompt,
        false,
      );
      res.json(response);
    }
  }

  @Get('tags')
  async listTags() {
    return await this.ollamaService.listTags();
  }

  @Post('generate-examples')
  async generateExamples(
    @Body()
    body: {
      word: string;
      definition?: string;
      sourceLanguage: string;
      targetLanguage: string;
      model?: string;
      count?: number;
      existingExamples?: string[];
    },
  ) {
    return await this.ollamaService.generateExamples(body);
  }

  @Post('analyze-grammar')
  async analyzeGrammar(
    @Body()
    body: {
      text: string;
      sourceLanguage: string;
      targetLanguage: string;
      model?: string;
    },
  ): Promise<GrammarAnalysisResponse> {
    try {
      return await this.ollamaService.analyzeGrammar(body);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      // If it's a known connection error, 503 Service Unavailable
      if (message.includes('Could not connect')) {
        // Rethrow as HttpException if possible, but for now simple throw propagates logging.
        // Ideally import HttpException from @nestjs/common
        // Let's just return a formatted error object for now if 500 persists.
        throw error;
      }
      throw error;
    }
  }
  @Post('translate')
  async translate(
    @Body()
    body: {
      text: string;
      targetLanguage: string;
      context?: string;
      sourceLanguage?: string;
      model?: string;
    },
  ) {
    return await this.ollamaService.translateText(body);
  }

  @Post('explain')
  async explain(
    @Body()
    body: {
      text: string;
      targetLanguage: string;
      context?: string;
      model?: string;
    },
  ) {
    return await this.ollamaService.explainText(body);
  }

  @Post('rich-translation')
  async richTranslation(
    @Body()
    body: {
      text: string;
      targetLanguage: string;
      context?: string;
      sourceLanguage?: string;
      model?: string;
    },
  ): Promise<RichTranslation> {
    return await this.ollamaService.getRichTranslation(body);
  }

  @Post('generate-content')
  async generateContent(
    @Body()
    body: GenerateContentDto,
  ) {
    return await this.ollamaService.generateContent(body);
  }
  @Post('generate-game-content')
  async generateGameContent(
    @Body()
    body: {
      topic: string;
      level: string;
      mode: string;
      sourceLanguage: string;
      targetLanguage: string;
      limit?: number;
      model?: string;
    },
  ) {
    return await this.ollamaService.generateGameContent(body);
  }
}
