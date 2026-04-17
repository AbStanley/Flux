import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Ollama, Message, ChatResponse, GenerateResponse } from 'ollama';

@Injectable()
export class OllamaClientService {
  private ollama: Ollama;
  private readonly logger = new Logger(OllamaClientService.name);
  private readonly ollamaHost: string;
  private verifiedModels = new Set<string>();
  private verifiedAt = 0;

  constructor() {
    this.ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
    this.logger.log(`Initializing Ollama Client with Host: ${this.ollamaHost}`);
    this.ollama = new Ollama({ host: this.ollamaHost });
  }

  async chat<S extends boolean = false>(
    model: string,
    messages: Message[],
    stream?: S,
  ): Promise<S extends true ? AsyncIterable<ChatResponse> : ChatResponse> {
    const action = `chat with model ${model}`;
    if (stream) {
      return this.execute(
        () => this.ollama.chat({ model, messages, stream: true }),
        action,
      ) as unknown as Promise<
        S extends true ? AsyncIterable<ChatResponse> : ChatResponse
      >;
    }
    return this.execute(
      () => this.ollama.chat({ model, messages, stream: false }),
      action,
    ) as unknown as Promise<
      S extends true ? AsyncIterable<ChatResponse> : ChatResponse
    >;
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
    },
  ): Promise<
    S extends true ? AsyncIterable<GenerateResponse> : GenerateResponse
  > {
    const action = `generate with model ${model}`;

    const baseRequest = {
      model,
      prompt,
      ...(options && { options }),
      ...(format && { format }),
    };

    if (stream) {
      return this.execute(
        () => this.ollama.generate({ ...baseRequest, stream: true }),
        action,
      ) as unknown as Promise<
        S extends true ? AsyncIterable<GenerateResponse> : GenerateResponse
      >;
    }
    return this.execute(
      () => this.ollama.generate({ ...baseRequest, stream: false }),
      action,
    ) as unknown as Promise<
      S extends true ? AsyncIterable<GenerateResponse> : GenerateResponse
    >;
  }

  private async execute<T>(fn: () => Promise<T>, action: string): Promise<T> {
    try {
      this.logger.log(`Ollama request: ${action}`);
      return await fn();
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

  async listTags() {
    try {
      this.logger.log(`Attempting to list tags from ${this.ollamaHost}`);
      return await this.execute(() => this.ollama.list(), 'list tags');
    } catch (e) {
      this.logger.error(`Failed to list tags from ${this.ollamaHost}`, e);
      throw e;
    }
  }

  async pullModel(
    model: string,
  ): Promise<
    AsyncIterable<{ status: string; total?: number; completed?: number }>
  > {
    return this.execute(
      () =>
        this.ollama.pull({ model, stream: true }) as unknown as Promise<
          AsyncIterable<{ status: string; total?: number; completed?: number }>
        >,
      `pull model ${model}`,
    );
  }

  async deleteModel(model: string): Promise<{ status: string }> {
    return this.execute(
      () =>
        this.ollama.delete({ model }) as unknown as Promise<{
          status: string;
        }>,
      `delete model ${model}`,
    );
  }

  async ensureModel(model?: string): Promise<string> {
    if (!model) {
      throw new HttpException(
        'No model specified. Please select a model first.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Cache verified models for 60s to avoid hammering /api/tags
    const now = Date.now();
    if (this.verifiedModels.has(model) && now - this.verifiedAt < 60_000) {
      return model;
    }

    const tags = await this.listTags();
    const available = tags.models?.map((m) => m.name) ?? [];
    this.verifiedModels = new Set(available);
    this.verifiedAt = now;

    if (available.includes(model)) return model;

    const hint =
      available.length > 0
        ? ` Available: ${available.join(', ')}`
        : ' No models found in Ollama.';
    throw new HttpException(
      `Model '${model}' not found.${hint}`,
      HttpStatus.NOT_FOUND,
    );
  }
}
