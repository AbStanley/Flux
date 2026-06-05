import {
  Body,
  Controller,
  Post,
  Get,
  Delete,
  Res,
  Req,
  Headers,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { OllamaService } from './services/ollama.service';
import { OllamaClientService } from './services/ollama-client.service';
import {
  GrammarAnalysisResponse,
  WritingAnalysisResponse,
  RichTranslation,
  RichConjugations,
  Message,
} from './interfaces/ollama.interfaces';
import { GenerateContentDto } from './dto/generate-content.dto';
import { Public } from '../auth/decorators/public.decorator';
import { cleanSelection } from './utils/ollama-utils';
import { DebugTraceService } from './services/debug-trace.service';

@Public()
@Controller('api')
export class OllamaController {
  constructor(
    private readonly ollamaService: OllamaService,
    private readonly ollamaClient: OllamaClientService,
    private readonly debugTraceService: DebugTraceService,
  ) {}

  @Post('chat')
  async chat(
    @Body()
    body: { model: string; messages: Message[]; stream?: boolean },
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
      existingExamples?: string[];
      traceId?: string;
    },
    @Req() req: Request,
    @Headers('x-flux-trace-id') clientTraceId?: string,
  ) {
    const traceId =
      body.traceId ||
      clientTraceId ||
      `trace-${Math.random().toString(36).substring(2, 11)}`;
    const startTime = Date.now();
    this.debugTraceService.recordTrace(traceId, {
      endpoint: '/api/generate-examples',
      method: 'POST',
      requestPayload: body,
    });

    const controller = new AbortController();
    req.on('close', () => controller.abort());

    try {
      const result = await this.ollamaService.generateExamples({
        ...body,
        signal: controller.signal,
        traceId,
      });
      this.debugTraceService.recordTrace(traceId, {
        rawResponse:
          typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        parsedResponse: result,
        durationMs: Date.now() - startTime,
      });
      return result;
    } catch (error: any) {
      this.debugTraceService.recordTrace(traceId, {
        error: error.message || String(error),
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
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
    @Req() req: Request,
  ): Promise<GrammarAnalysisResponse> {
    const controller = new AbortController();
    req.on('close', () => controller.abort());
    return await this.ollamaService.analyzeGrammar({
      ...body,
      signal: controller.signal,
    });
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
      traceId?: string;
    },
    @Req() req: Request,
    @Headers('x-flux-trace-id') clientTraceId?: string,
  ) {
    body.text = cleanSelection(body.text);
    const traceId =
      body.traceId ||
      clientTraceId ||
      `trace-${Math.random().toString(36).substring(2, 11)}`;
    const startTime = Date.now();
    this.debugTraceService.recordTrace(traceId, {
      endpoint: '/api/translate',
      method: 'POST',
      requestPayload: body,
    });

    const controller = new AbortController();
    req.on('close', () => controller.abort());

    try {
      const result = await this.ollamaService.translateText({
        ...body,
        signal: controller.signal,
        traceId,
      });
      this.debugTraceService.recordTrace(traceId, {
        rawResponse:
          typeof result === 'string' ? result : JSON.stringify(result, null, 2),
        parsedResponse: result,
        durationMs: Date.now() - startTime,
      });
      return result;
    } catch (error: any) {
      this.debugTraceService.recordTrace(traceId, {
        error: error.message || String(error),
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
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
    @Req() req: Request,
  ) {
    body.text = cleanSelection(body.text);
    const controller = new AbortController();
    req.on('close', () => controller.abort());
    return await this.ollamaService.explainText({
      ...body,
      signal: controller.signal,
    });
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
      stream?: boolean;
      traceId?: string;
    },
    @Res() res: Response,
    @Req() req: Request,
    @Headers('x-flux-trace-id') clientTraceId?: string,
  ) {
    body.text = cleanSelection(body.text);
    const traceId =
      body.traceId ||
      clientTraceId ||
      `trace-${Math.random().toString(36).substring(2, 11)}`;
    res.setHeader('x-flux-trace-id', traceId);

    const startTime = Date.now();
    this.debugTraceService.recordTrace(traceId, {
      endpoint: '/api/rich-translation',
      method: 'POST',
      requestPayload: body,
    });

    const controller = new AbortController();
    req.on('close', () => controller.abort());

    if (body.stream) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      try {
        const stream = await this.ollamaService.getRichTranslationStream({
          ...body,
          signal: controller.signal,
          traceId,
        });
        let accumulatedText = '';
        for await (const chunk of stream) {
          accumulatedText += chunk.response || '';
          res.write(JSON.stringify(chunk) + '\n');
        }
        res.end();
        this.debugTraceService.recordTrace(traceId, {
          rawResponse: accumulatedText,
          parsedResponse: accumulatedText,
          durationMs: Date.now() - startTime,
        });
      } catch (error: any) {
        this.debugTraceService.recordTrace(traceId, {
          error: error.message || String(error),
          durationMs: Date.now() - startTime,
        });
        res.end();
      }
      return;
    }

    try {
      const result: RichTranslation =
        await this.ollamaService.getRichTranslation({
          ...body,
          signal: controller.signal,
          traceId,
        });
      this.debugTraceService.recordTrace(traceId, {
        rawResponse: JSON.stringify(result, null, 2),
        parsedResponse: result,
        durationMs: Date.now() - startTime,
      });
      res.json(result);
    } catch (error: any) {
      this.debugTraceService.recordTrace(traceId, {
        error: error.message || String(error),
        durationMs: Date.now() - startTime,
      });
      throw new HttpException(
        error.message || String(error),
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('rich-translation/conjugations')
  async richTranslationConjugations(
    @Body()
    body: {
      infinitive: string;
      sourceLanguage: string;
      model?: string;
      stream?: boolean;
      traceId?: string;
    },
    @Res() res: Response,
    @Req() req: Request,
    @Headers('x-flux-trace-id') clientTraceId?: string,
  ) {
    const traceId =
      body.traceId ||
      clientTraceId ||
      `trace-${Math.random().toString(36).substring(2, 11)}`;
    res.setHeader('x-flux-trace-id', traceId);

    const startTime = Date.now();
    this.debugTraceService.recordTrace(traceId, {
      endpoint: '/api/rich-translation/conjugations',
      method: 'POST',
      requestPayload: body,
    });

    const controller = new AbortController();
    req.on('close', () => controller.abort());

    if (body.stream) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      try {
        const accumulated: any[] = [];
        for await (const item of this.ollamaService.getConjugationsStream({
          ...body,
          signal: controller.signal,
          traceId,
        })) {
          accumulated.push(item);
          res.write(JSON.stringify(item) + '\n');
        }
        res.end();
        this.debugTraceService.recordTrace(traceId, {
          rawResponse: JSON.stringify(accumulated, null, 2),
          parsedResponse: accumulated,
          durationMs: Date.now() - startTime,
        });
      } catch (error: any) {
        this.debugTraceService.recordTrace(traceId, {
          error: error.message || String(error),
          durationMs: Date.now() - startTime,
        });
        res.end();
      }
      return;
    }

    try {
      const result: RichConjugations = await this.ollamaService.getConjugations(
        {
          ...body,
          signal: controller.signal,
          traceId,
        },
      );
      this.debugTraceService.recordTrace(traceId, {
        rawResponse: JSON.stringify(result, null, 2),
        parsedResponse: result,
        durationMs: Date.now() - startTime,
      });
      res.json(result);
    } catch (error: any) {
      this.debugTraceService.recordTrace(traceId, {
        error: error.message || String(error),
        durationMs: Date.now() - startTime,
      });
      throw new HttpException(
        error.message || String(error),
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('generate-content')
  async generateContent(
    @Body() body: GenerateContentDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const controller = new AbortController();
    req.on('close', () => controller.abort());

    if (body.stream) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      const stream = await this.ollamaService.generateContentStream({
        ...body,
        signal: controller.signal,
      });
      for await (const part of stream) {
        res.write(JSON.stringify(part) + '\n');
      }
      res.end();
    } else {
      const result = await this.ollamaService.generateContent({
        ...body,
        signal: controller.signal,
      });
      res.json(result);
    }
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
      stream?: boolean;
      sourceLangCode?: string;
      targetLangCode?: string;
      verb?: string;
      tense?: string;
    },
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const controller = new AbortController();
    req.on('close', () => controller.abort());

    if (body.stream) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      const stream = await this.ollamaService.generateGameContentStream({
        ...body,
        signal: controller.signal,
      });
      for await (const part of stream) {
        res.write(JSON.stringify(part) + '\n');
      }
      res.end();
    } else {
      const result = await this.ollamaService.generateGameContent({
        ...body,
        signal: controller.signal,
      });
      res.json(result);
    }
  }

  @Post('check-writing')
  async checkWriting(
    @Body()
    body: {
      text: string;
      sourceLanguage: string;
      model?: string;
      mode?: 'minimal' | 'full';
    },
    @Req() req: Request,
  ): Promise<WritingAnalysisResponse> {
    const controller = new AbortController();
    req.on('close', () => controller.abort());
    return this.ollamaService.analyzeWriting({
      ...body,
      signal: controller.signal,
    });
  }

  @Post('models/pull')
  async pullModel(@Body() body: { model: string }, @Res() res: Response) {
    res.setHeader('Content-Type', 'application/x-ndjson');
    const stream = await this.ollamaClient.pullModel(body.model);
    for await (const part of stream) {
      res.write(JSON.stringify(part) + '\n');
    }
    res.end();
  }

  @Delete('models')
  async deleteModel(@Body() body: { model: string }) {
    return this.ollamaClient.deleteModel(body.model);
  }

  @Get('debug/traces/:id')
  async getTrace(@Param('id') id: string) {
    const trace = this.debugTraceService.getTrace(id);
    if (!trace) {
      throw new HttpException('Trace not found', HttpStatus.NOT_FOUND);
    }
    return trace;
  }

  @Get('debug/traces')
  async getTraces() {
    return this.debugTraceService.getAllTraces();
  }
}
