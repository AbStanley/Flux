import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ChatResponse, GenerateResponse } from 'ollama';
import { AiClient } from '../interfaces/ai-provider.interface';
import { Message } from '../interfaces/ollama.interfaces';

interface OpenRouterChoice {
  message?: {
    role: string;
    content: string;
  };
  delta?: {
    content?: string;
  };
}

interface OpenAIUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
  usage?: OpenAIUsage;
}

@Injectable()
export class OpenRouterProviderService implements AiClient {
  private readonly logger = new Logger(OpenRouterProviderService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
  }

  private getHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://flux-app.com',
      'X-Title': 'Flux',
    };
  }

  async chat(
    model: string,
    messages: Message[],
    stream?: boolean,
    signal?: AbortSignal,
  ): Promise<ChatResponse | AsyncIterable<ChatResponse>> {
    if (!this.apiKey) {
      throw new HttpException(
        'OpenRouter API key is not configured.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: !!stream,
        ...(stream && { stream_options: { include_usage: true } }),
      }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      this.logger.error(
        `OpenRouter Chat Error: ${response.status} - ${errText}`,
      );
      throw new HttpException(
        `OpenRouter API error: ${errText}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (stream) {
      return this.handleStream(
        response.body!,
        'chat',
      ) as AsyncIterable<ChatResponse>;
    }

    const data = (await response.json()) as OpenRouterResponse;
    return {
      model,
      created_at: new Date(),
      done: true,
      message: {
        role: 'assistant',
        content: data.choices?.[0]?.message?.content || '',
      },
      prompt_eval_count: data.usage?.prompt_tokens,
      eval_count: data.usage?.completion_tokens,
    } as unknown as ChatResponse;
  }

  async generate(
    model: string,
    prompt: string,
    stream?: boolean,
    format?: 'json' | Record<string, unknown>,
    options?: {
      temperature?: number;
      top_p?: number;
      top_k?: number;
    },
    signal?: AbortSignal,
  ): Promise<GenerateResponse | AsyncIterable<GenerateResponse>> {
    if (!this.apiKey) {
      throw new HttpException(
        'OpenRouter API key is not configured.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const payload: Record<string, unknown> = {
      model,
      messages: [{ role: 'user', content: prompt }],
      stream: !!stream,
      temperature: options?.temperature,
      top_p: options?.top_p,
      ...(stream && { stream_options: { include_usage: true } }),
    };

    if (format === 'json' || (format && typeof format === 'object')) {
      payload.response_format = { type: 'json_object' };
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      this.logger.error(
        `OpenRouter Generate Error: ${response.status} - ${errText}`,
      );
      throw new HttpException(
        `OpenRouter API error: ${errText}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (stream) {
      return this.handleStream(
        response.body!,
        'generate',
      ) as AsyncIterable<GenerateResponse>;
    }

    const data = (await response.json()) as OpenRouterResponse;
    return {
      model,
      created_at: new Date(),
      done: true,
      response: data.choices?.[0]?.message?.content || '',
      prompt_eval_count: data.usage?.prompt_tokens,
      eval_count: data.usage?.completion_tokens,
    } as unknown as GenerateResponse;
  }

  listModels(): Promise<string[]> {
    return Promise.resolve([
      'google/gemini-2.5-flash',
      'google/gemini-2.5-pro',
      'meta-llama/llama-3.1-8b-instruct',
    ]);
  }

  private async *handleStream(
    body: ReadableStream<Uint8Array>,
    type: 'chat' | 'generate',
  ): AsyncIterable<ChatResponse | GenerateResponse> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6)) as OpenRouterResponse;
              
              if (parsed.usage) {
                if (type === 'chat') {
                  yield {
                    model: '',
                    created_at: new Date(),
                    done: true,
                    prompt_eval_count: parsed.usage.prompt_tokens,
                    eval_count: parsed.usage.completion_tokens,
                  } as unknown as ChatResponse;
                } else {
                  yield {
                    model: '',
                    created_at: new Date(),
                    done: true,
                    prompt_eval_count: parsed.usage.prompt_tokens,
                    eval_count: parsed.usage.completion_tokens,
                  } as unknown as GenerateResponse;
                }
              }

              const text = parsed.choices?.[0]?.delta?.content || '';
              if (text) {
                if (type === 'chat') {
                  yield {
                    model: '',
                    created_at: new Date(),
                    message: { role: 'assistant', content: text },
                    done: false,
                  } as ChatResponse;
                } else {
                  yield {
                    model: '',
                    created_at: new Date(),
                    response: text,
                    done: false,
                  } as GenerateResponse;
                }
              }
            } catch {
              // Ignore partial JSON parse errors
            }
          }
        }
      }
      if (type === 'chat') {
        yield {
          model: '',
          created_at: new Date(),
          message: { role: 'assistant', content: '' },
          done: true,
        } as ChatResponse;
      } else {
        yield {
          model: '',
          created_at: new Date(),
          response: '',
          done: true,
        } as GenerateResponse;
      }
    } finally {
      reader.releaseLock();
    }
  }
}
