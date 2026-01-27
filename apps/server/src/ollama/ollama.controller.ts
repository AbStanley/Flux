import { Body, Controller, Post, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { OllamaService } from './ollama.service';

@Controller('api')
export class OllamaController {
  constructor(private readonly ollamaService: OllamaService) { }

  @Post('chat')
  async chat(
    @Body() body: { model: string; messages: any[]; stream?: boolean },
    @Res() res: Response,
  ) {
    if (body.stream) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      const stream = (await this.ollamaService.chat(
        body.model,
        body.messages,
        true,
      )) as AsyncIterable<any>;
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
      )) as AsyncIterable<any>;
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
  ) {
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
}
