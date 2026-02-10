import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Ollama, Message, ChatResponse, GenerateResponse } from 'ollama';

@Injectable()
export class OllamaClientService {
    private ollama: Ollama;
    private readonly logger = new Logger(OllamaClientService.name);
    private readonly ollamaHost: string;

    constructor() {
        this.ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
        this.ollama = new Ollama({ host: this.ollamaHost });
    }

    async chat<S extends boolean = false>(
        model: string,
        messages: Message[],
        stream?: S,
    ): Promise<S extends true ? AsyncIterable<ChatResponse> : ChatResponse> {
        return this.execute(
            () =>
                this.ollama.chat({
                    model,
                    messages: messages as any[],
                    stream: Boolean(stream),
                } as any) as any,
            `chat with model ${model}`,
        );
    }

    async generate<S extends boolean = false>(
        model: string,
        prompt: string,
        stream?: S,
        format?: 'json',
        options?: { num_ctx?: number; num_predict?: number; temperature?: number },
    ): Promise<S extends true ? AsyncIterable<GenerateResponse> : GenerateResponse> {
        return this.execute(
            () =>
                this.ollama.generate({
                    model,
                    prompt,
                    stream: Boolean(stream),
                    format,
                    options,
                } as any) as any,
            `generate with model ${model}`,
        );
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
        return this.execute(() => this.ollama.list(), 'list tags');
    }

    async ensureModel(model?: string): Promise<string> {
        if (model) return model;

        const tags = await this.listTags();
        if (tags.models && tags.models.length > 0) {
            return tags.models[0].name;
        }

        this.logger.warn(`No models found at ${this.ollamaHost}`);
        throw new HttpException('No Ollama models available', HttpStatus.NOT_FOUND);
    }
}
