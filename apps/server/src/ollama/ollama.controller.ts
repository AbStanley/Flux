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
  UseGuards,
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
import { AiQuotaGuard } from '../auth/guards/ai-quota.guard';
import { cleanSelection } from './utils/ollama-utils';
import { DebugTraceService } from './services/debug-trace.service';
import { OllamaModelManagerService } from './services/ollama-model-manager.service';

@Controller('api')
export class OllamaController {
  constructor(
    private readonly ollamaService: OllamaService,
    private readonly ollamaClient: OllamaClientService,
    private readonly modelManager: OllamaModelManagerService,
    private readonly debugTraceService: DebugTraceService,
  ) {}

  @Post('chat')
  @UseGuards(AiQuotaGuard)
  async chat(
    @Body()
    body: { model: string; messages: Message[]; stream?: boolean },
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const request = req as unknown as { user?: { id: string; email: string } };
    const userId = request.user?.id;
    const traceId = `trace-${Math.random().toString(36).substring(2, 11)}`;

    if (body.stream) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.flushHeaders();
      const stream = (await this.ollamaService.chat(
        body.model,
        body.messages,
        true,
        traceId,
        userId,
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
        traceId,
        userId,
      );
      res.json(response);
    }
  }

  @Post('generate')
  @UseGuards(AiQuotaGuard)
  async generate(
    @Body() body: { model: string; prompt: string; stream?: boolean },
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const request = req as unknown as { user?: { id: string; email: string } };
    const userId = request.user?.id;
    const traceId = `trace-${Math.random().toString(36).substring(2, 11)}`;

    if (body.stream) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.flushHeaders();
      const stream = (await this.ollamaService.generate(
        body.model,
        body.prompt,
        true,
        traceId,
        userId,
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
        traceId,
        userId,
      );
      res.json(response);
    }
  }

  @Get('tags')
  @Public()
  listTags() {
    return this.ollamaService.listTags();
  }

  @Post('generate-examples')
  @UseGuards(AiQuotaGuard)
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
    const request = req as unknown as { user?: { id: string; email: string } };
    const userId = request.user?.id;
    const traceId =
      body.traceId ||
      clientTraceId ||
      `trace-${Math.random().toString(36).substring(2, 11)}`;
    const startTime = Date.now();
    this.debugTraceService.recordTrace(traceId, {
      endpoint: '/api/generate-examples',
      method: 'POST',
      requestPayload: body,
      userId,
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
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.debugTraceService.recordTrace(traceId, {
        error: err.message || String(error),
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }

  @Post('analyze-grammar')
  @UseGuards(AiQuotaGuard)
  async analyzeGrammar(
    @Body()
    body: {
      text: string;
      sourceLanguage: string;
      targetLanguage: string;
      model?: string;
      traceId?: string;
    },
    @Req() req: Request,
  ): Promise<GrammarAnalysisResponse> {
    const request = req as unknown as { user?: { id: string; email: string } };
    const userId = request.user?.id;
    const traceId =
      body.traceId ||
      `trace-${Math.random().toString(36).substring(2, 11)}`;
    const startTime = Date.now();
    this.debugTraceService.recordTrace(traceId, {
      endpoint: '/api/analyze-grammar',
      method: 'POST',
      requestPayload: body,
      userId,
    });

    const controller = new AbortController();
    req.on('close', () => controller.abort());
    try {
      const result = await this.ollamaService.analyzeGrammar({
        ...body,
        signal: controller.signal,
        traceId,
      });
      this.debugTraceService.recordTrace(traceId, {
        rawResponse: JSON.stringify(result),
        durationMs: Date.now() - startTime,
      });
      return result;
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.debugTraceService.recordTrace(traceId, {
        error: err.message || String(error),
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }

  @Post('translate')
  @UseGuards(AiQuotaGuard)
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
    const request = req as unknown as { user?: { id: string; email: string } };
    const userId = request.user?.id;
    const traceId =
      body.traceId ||
      clientTraceId ||
      `trace-${Math.random().toString(36).substring(2, 11)}`;
    const startTime = Date.now();
    this.debugTraceService.recordTrace(traceId, {
      endpoint: '/api/translate',
      method: 'POST',
      requestPayload: body,
      userId,
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
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.debugTraceService.recordTrace(traceId, {
        error: err.message || String(error),
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }

  @Post('explain')
  @UseGuards(AiQuotaGuard)
  async explain(
    @Body()
    body: {
      text: string;
      targetLanguage: string;
      context?: string;
      model?: string;
      traceId?: string;
    },
    @Req() req: Request,
  ) {
    body.text = cleanSelection(body.text);
    const request = req as unknown as { user?: { id: string; email: string } };
    const userId = request.user?.id;
    const traceId =
      body.traceId ||
      `trace-${Math.random().toString(36).substring(2, 11)}`;
    const startTime = Date.now();
    this.debugTraceService.recordTrace(traceId, {
      endpoint: '/api/explain',
      method: 'POST',
      requestPayload: body,
      userId,
    });

    const controller = new AbortController();
    req.on('close', () => controller.abort());
    try {
      const result = await this.ollamaService.explainText({
        ...body,
        signal: controller.signal,
        traceId,
      });
      this.debugTraceService.recordTrace(traceId, {
        rawResponse: result,
        durationMs: Date.now() - startTime,
      });
      return result;
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.debugTraceService.recordTrace(traceId, {
        error: err.message || String(error),
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }

  @Post('rich-translation')
  @UseGuards(AiQuotaGuard)
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
      regenerate?: boolean;
      preferredTranslation?: string;
    },
    @Res() res: Response,
    @Req() req: Request,
    @Headers('x-flux-trace-id') clientTraceId?: string,
  ) {
    body.text = cleanSelection(body.text);
    const request = req as unknown as { user?: { id: string; email: string } };
    const userId = request.user?.id;
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
      userId,
    });

    const controller = new AbortController();
    req.on('close', () => controller.abort());

    if (body.stream) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.flushHeaders();
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
      } catch (error: unknown) {
        const err = error as { message?: string };
        this.debugTraceService.recordTrace(traceId, {
          error: err.message || String(error),
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
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      this.debugTraceService.recordTrace(traceId, {
        error: err.message || String(error),
        durationMs: Date.now() - startTime,
      });
      throw new HttpException(
        err.message || String(error),
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('rich-translation/conjugations')
  @UseGuards(AiQuotaGuard)
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
    const request = req as unknown as { user?: { id: string; email: string } };
    const userId = request.user?.id;
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
      userId,
    });

    const controller = new AbortController();
    req.on('close', () => controller.abort());

    if (body.stream) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.flushHeaders();
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
      } catch (error: unknown) {
        const err = error as { message?: string };
        this.debugTraceService.recordTrace(traceId, {
          error: err.message || String(error),
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
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      this.debugTraceService.recordTrace(traceId, {
        error: err.message || String(error),
        durationMs: Date.now() - startTime,
      });
      throw new HttpException(
        err.message || String(error),
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('generate-content')
  @UseGuards(AiQuotaGuard)
  async generateContent(
    @Body() body: GenerateContentDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const controller = new AbortController();
    req.on('close', () => controller.abort());

    if (body.stream) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.flushHeaders();
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
  @UseGuards(AiQuotaGuard)
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
      res.flushHeaders();
      const stream = this.ollamaService.generateGameContentStream({
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
  @UseGuards(AiQuotaGuard)
  async checkWriting(
    @Body()
    body: {
      text: string;
      sourceLanguage: string;
      model?: string;
      mode?: 'minimal' | 'full';
      traceId?: string;
    },
    @Req() req: Request,
  ): Promise<WritingAnalysisResponse> {
    const request = req as unknown as { user?: { id: string; email: string } };
    const userId = request.user?.id;
    const traceId =
      body.traceId ||
      `trace-${Math.random().toString(36).substring(2, 11)}`;
    const startTime = Date.now();
    this.debugTraceService.recordTrace(traceId, {
      endpoint: '/api/check-writing',
      method: 'POST',
      requestPayload: body,
      userId,
    });

    const controller = new AbortController();
    req.on('close', () => controller.abort());
    try {
      const result = await this.ollamaService.analyzeWriting({
        ...body,
        signal: controller.signal,
        traceId,
      });
      this.debugTraceService.recordTrace(traceId, {
        rawResponse: JSON.stringify(result),
        durationMs: Date.now() - startTime,
      });
      return result;
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.debugTraceService.recordTrace(traceId, {
        error: err.message || String(error),
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }

  @Post('models/pull')
  async pullModel(@Body() body: { model: string }, @Res() res: Response) {
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.flushHeaders();
    const stream = await this.modelManager.pullModel(body.model);
    for await (const part of stream) {
      res.write(JSON.stringify(part) + '\n');
    }
    res.end();
  }

  @Delete('models')
  async deleteModel(@Body() body: { model: string }) {
    return this.modelManager.deleteModel(body.model);
  }

  @Get('debug/traces/:id')
  getTrace(@Param('id') id: string) {
    const trace = this.debugTraceService.getTrace(id);
    if (!trace) {
      throw new HttpException('Trace not found', HttpStatus.NOT_FOUND);
    }
    return trace;
  }

  @Get('debug/traces')
  getTraces() {
    return this.debugTraceService.getAllTraces();
  }
}
