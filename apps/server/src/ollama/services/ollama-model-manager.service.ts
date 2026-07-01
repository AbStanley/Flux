import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Ollama } from 'ollama';
import { OpenRouterProviderService } from './openrouter-provider.service';
import { GeminiProviderService } from './gemini-provider.service';

@Injectable()
export class OllamaModelManagerService {
  private readonly logger = new Logger(OllamaModelManagerService.name);
  private readonly ollamaHost: string;
  private readonly provider: string;
  private verifiedModels = new Set<string>();
  private verifiedAt = 0;

  constructor(
    private readonly openRouter: OpenRouterProviderService,
    private readonly gemini: GeminiProviderService,
  ) {
    this.provider = process.env.AI_PROVIDER || 'ollama';
    this.ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
  }

  async listTags() {
    if (this.provider === 'openrouter') {
      const models = await this.openRouter.listModels();
      return { models: models.map((name) => ({ name })) };
    } else if (this.provider === 'gemini') {
      const models = await this.gemini.listModels();
      return { models: models.map((name) => ({ name })) };
    }

    return this.execute((client) => client.list(), 'list tags');
  }

  async pullModel(
    model: string,
  ): Promise<
    AsyncIterable<{ status: string; total?: number; completed?: number }>
  > {
    if (this.provider !== 'ollama') {
      const mockGenerator = async function* () {
        await Promise.resolve();
        yield { status: 'success', completed: 100, total: 100 };
      };
      return mockGenerator();
    }
    return this.execute(
      (client) =>
        client.pull({ model, stream: true }) as unknown as Promise<
          AsyncIterable<{ status: string; total?: number; completed?: number }>
        >,
      `pull model ${model}`,
    );
  }

  async deleteModel(model: string): Promise<{ status: string }> {
    if (this.provider !== 'ollama') {
      return { status: 'success' };
    }
    return this.execute(
      (client) =>
        client.delete({ model }) as unknown as Promise<{
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

    if (this.provider !== 'ollama') {
      return model;
    }

    const now = Date.now();
    if (this.verifiedModels.has(model) && now - this.verifiedAt < 300_000) {
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

  private async execute<T>(
    fn: (client: Ollama) => Promise<T>,
    action: string,
  ): Promise<T> {
    try {
      this.logger.log(`Ollama request: ${action}`);
      const client = new Ollama({ host: this.ollamaHost });
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
