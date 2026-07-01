import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Ollama, Message, ChatResponse, GenerateResponse } from 'ollama';
import { DebugTraceService } from './debug-trace.service';
import { OpenRouterProviderService } from './openrouter-provider.service';
import { GeminiProviderService } from './gemini-provider.service';
import { OllamaModelManagerService } from './ollama-model-manager.service';

@Injectable()
export class OllamaClientService {
  private ollama!: Ollama;
  private readonly logger = new Logger(OllamaClientService.name);
  private readonly ollamaHost: string;
  private readonly provider: string;

  constructor(
    private readonly debugTraceService: DebugTraceService,
    private readonly openRouter: OpenRouterProviderService,
    private readonly gemini: GeminiProviderService,
    private readonly modelManager: OllamaModelManagerService,
  ) {
    this.provider = process.env.AI_PROVIDER || 'ollama';
    this.ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
    this.logger.log(`Initializing AI Client (Provider: ${this.provider})`);
    if (this.provider === 'ollama') {
      this.ollama = new Ollama({ host: this.ollamaHost });
    }
  }

  async ensureModel(model?: string): Promise<string> {
    return this.modelManager.ensureModel(model);
  }

  async chat<S extends boolean = false>(
    model: string,
    messages: Message[],
    stream?: S,
    signal?: AbortSignal,
    traceId?: string,
    userId?: string,
  ): Promise<S extends true ? AsyncIterable<ChatResponse> : ChatResponse> {
    if (traceId) {
      const promptText = messages
        .map((m) => `[${m.role}]: ${m.content}`)
        .join('\n');
      this.debugTraceService.recordTrace(traceId, {
        model,
        prompt: promptText,
        userId,
      });
    }

    if (this.provider === 'openrouter') {
      const response = await this.openRouter.chat(
        model,
        messages,
        stream as boolean,
        signal,
      );
      if (stream) {
        return this.wrapStream(
          response as AsyncIterable<ChatResponse>,
          traceId,
          (promptTokens, completionTokens, fullText) => {
            if (traceId) {
              this.debugTraceService.recordTrace(traceId, {
                rawResponse: fullText,
                promptTokens,
                completionTokens,
                totalTokens: promptTokens + completionTokens,
              });
            }
          },
        ) as unknown as S extends true ? AsyncIterable<ChatResponse> : ChatResponse;
      }

      const nonStreamRes = response as ChatResponse;
      if (traceId) {
        const promptTokens = (nonStreamRes as any).prompt_eval_count || 0;
        const completionTokens = (nonStreamRes as any).eval_count || 0;
        this.debugTraceService.recordTrace(traceId, {
          rawResponse: nonStreamRes.message?.content || JSON.stringify(nonStreamRes),
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        });
      }
      return nonStreamRes as unknown as S extends true
        ? AsyncIterable<ChatResponse>
        : ChatResponse;
    } else if (this.provider === 'gemini') {
      const response = await this.gemini.chat(
        model,
        messages,
        stream as boolean,
        signal,
      );
      if (stream) {
        return this.wrapStream(
          response as AsyncIterable<ChatResponse>,
          traceId,
          (promptTokens, completionTokens, fullText) => {
            if (traceId) {
              this.debugTraceService.recordTrace(traceId, {
                rawResponse: fullText,
                promptTokens,
                completionTokens,
                totalTokens: promptTokens + completionTokens,
              });
            }
          },
        ) as unknown as S extends true ? AsyncIterable<ChatResponse> : ChatResponse;
      }

      const nonStreamRes = response as ChatResponse;
      if (traceId) {
        const promptTokens = (nonStreamRes as any).prompt_eval_count || 0;
        const completionTokens = (nonStreamRes as any).eval_count || 0;
        this.debugTraceService.recordTrace(traceId, {
          rawResponse: nonStreamRes.message?.content || JSON.stringify(nonStreamRes),
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        });
      }
      return nonStreamRes as unknown as S extends true
        ? AsyncIterable<ChatResponse>
        : ChatResponse;
    }

    if (stream) {
      const response = await this.execute(
        (client) => client.chat({ model, messages, stream: true }),
        `chat with ${model}`,
        signal,
      );
      return this.wrapStream(
        response,
        traceId,
        (promptTokens, completionTokens, fullText) => {
          if (traceId) {
            this.debugTraceService.recordTrace(traceId, {
              rawResponse: fullText,
              promptTokens,
              completionTokens,
              totalTokens: promptTokens + completionTokens,
            });
          }
        },
      ) as unknown as S extends true ? AsyncIterable<ChatResponse> : ChatResponse;
    }

    const response = await this.execute(
      (client) => client.chat({ model, messages, stream: false }),
      `chat with ${model}`,
      signal,
    );
    if (traceId) {
      const promptTokens = response.prompt_eval_count || 0;
      const completionTokens = response.eval_count || 0;
      this.debugTraceService.recordTrace(traceId, {
        rawResponse: response.message?.content || JSON.stringify(response),
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      });
    }
    return response as unknown as S extends true
      ? AsyncIterable<ChatResponse>
      : ChatResponse;
  }

  async generate<S extends boolean = false>(
    model: string,
    prompt: string,
    stream?: S,
    format?: 'json' | Record<string, unknown>,
    options?: {
      num_ctx?: number;
      num_predict?: number;
      temperature?: number;
      top_k?: number;
      top_p?: number;
      stop?: string[];
    },
    signal?: AbortSignal,
    traceId?: string,
    userId?: string,
  ): Promise<
    S extends true ? AsyncIterable<GenerateResponse> : GenerateResponse
  > {
    if (traceId) {
      this.debugTraceService.recordTrace(traceId, { model, prompt, userId });
    }

    if (this.provider === 'openrouter') {
      const response = await this.openRouter.generate(
        model,
        prompt,
        stream as boolean,
        format,
        options,
        signal,
      );
      if (stream) {
        return this.wrapStream(
          response as AsyncIterable<GenerateResponse>,
          traceId,
          (promptTokens, completionTokens, fullText) => {
            if (traceId) {
              this.debugTraceService.recordTrace(traceId, {
                rawResponse: fullText,
                promptTokens,
                completionTokens,
                totalTokens: promptTokens + completionTokens,
              });
            }
          },
        ) as unknown as S extends true ? AsyncIterable<GenerateResponse> : GenerateResponse;
      }

      const nonStreamRes = response as GenerateResponse;
      if (traceId) {
        const promptTokens = (nonStreamRes as any).prompt_eval_count || 0;
        const completionTokens = (nonStreamRes as any).eval_count || 0;
        this.debugTraceService.recordTrace(traceId, {
          rawResponse: nonStreamRes.response || JSON.stringify(nonStreamRes),
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        });
      }
      return nonStreamRes as unknown as S extends true
        ? AsyncIterable<GenerateResponse>
        : GenerateResponse;
    } else if (this.provider === 'gemini') {
      const response = await this.gemini.generate(
        model,
        prompt,
        stream as boolean,
        format,
        options,
        signal,
      );
      if (stream) {
        return this.wrapStream(
          response as AsyncIterable<GenerateResponse>,
          traceId,
          (promptTokens, completionTokens, fullText) => {
            if (traceId) {
              this.debugTraceService.recordTrace(traceId, {
                rawResponse: fullText,
                promptTokens,
                completionTokens,
                totalTokens: promptTokens + completionTokens,
              });
            }
          },
        ) as unknown as S extends true ? AsyncIterable<GenerateResponse> : GenerateResponse;
      }

      const nonStreamRes = response as GenerateResponse;
      if (traceId) {
        const promptTokens = (nonStreamRes as any).prompt_eval_count || 0;
        const completionTokens = (nonStreamRes as any).eval_count || 0;
        this.debugTraceService.recordTrace(traceId, {
          rawResponse: nonStreamRes.response || JSON.stringify(nonStreamRes),
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        });
      }
      return nonStreamRes as unknown as S extends true
        ? AsyncIterable<GenerateResponse>
        : GenerateResponse;
    }

    const baseRequest = {
      model,
      prompt,
      ...(options && { options }),
      ...(format && { format }),
    };

    if (stream) {
      const response = await this.execute(
        (client) => client.generate({ ...baseRequest, stream: true }),
        `generate with ${model}`,
        signal,
      );
      return this.wrapStream(
        response,
        traceId,
        (promptTokens, completionTokens, fullText) => {
          if (traceId) {
            this.debugTraceService.recordTrace(traceId, {
              rawResponse: fullText,
              promptTokens,
              completionTokens,
              totalTokens: promptTokens + completionTokens,
            });
          }
        },
      ) as unknown as S extends true ? AsyncIterable<GenerateResponse> : GenerateResponse;
    }

    const response = await this.execute(
      (client) => client.generate({ ...baseRequest, stream: false }),
      `generate with ${model}`,
      signal,
    );
    if (traceId) {
      const promptTokens = response.prompt_eval_count || 0;
      const completionTokens = response.eval_count || 0;
      this.debugTraceService.recordTrace(traceId, {
        rawResponse: response.response || JSON.stringify(response),
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      });
    }
    return response as unknown as S extends true
      ? AsyncIterable<GenerateResponse>
      : GenerateResponse;
  }

  private async *wrapStream<
    T extends {
      done?: boolean;
      prompt_eval_count?: number;
      eval_count?: number;
      response?: string;
      message?: { role: string; content: string };
    },
  >(
    stream: AsyncIterable<T>,
    traceId?: string,
    onFinish?: (
      promptTokens: number,
      completionTokens: number,
      fullResponseText: string,
    ) => void,
  ): AsyncIterable<T> {
    let finalPromptTokens = 0;
    let finalCompletionTokens = 0;
    let accumulatedText = '';

    for await (const chunk of stream) {
      if (chunk.prompt_eval_count) finalPromptTokens = chunk.prompt_eval_count;
      if (chunk.eval_count) finalCompletionTokens = chunk.eval_count;

      const chunkText = chunk.response || chunk.message?.content || '';
      accumulatedText += chunkText;

      yield chunk;
    }

    if (onFinish) {
      onFinish(finalPromptTokens, finalCompletionTokens, accumulatedText);
    }
  }

  private async execute<T>(
    fn: (client: Ollama) => Promise<T>,
    action: string,
    signal?: AbortSignal,
  ): Promise<T> {
    try {
      this.logger.log(`Ollama request: ${action}`);
      const client = signal
        ? new Ollama({
            host: this.ollamaHost,
            fetch: (url: string | URL | Request, init?: RequestInit) =>
              fetch(url, { ...init, signal }),
          })
        : this.ollama;

      return await fn(client);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Ollama Error [${action}]: ${msg}`, error);

      if (msg.includes('fetch failed') || msg.includes('connect')) {
        throw new HttpException(
          'Ollama server is unreachable.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw new HttpException(
        `Ollama error: ${msg}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
