import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ChatResponse, GenerateResponse } from 'ollama';
import { AiClient } from '../interfaces/ai-provider.interface';
import { Message } from '../interfaces/ollama.interfaces';

interface GeminiChoice {
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

interface GeminiResponse {
  choices?: GeminiChoice[];
  usage?: OpenAIUsage;
}

@Injectable()
export class GeminiProviderService implements AiClient {
  private readonly logger = new Logger(GeminiProviderService.name);
  private readonly apiKey: string;
  private readonly baseUrl =
    'https://generativelanguage.googleapis.com/v1beta/openai';

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
  }

  private getHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
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
        'Gemini API key is not configured.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const targetModel = model || 'gemini-1.5-flash';

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: targetModel,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: !!stream,
        ...(stream && { stream_options: { include_usage: true } }),
      }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      this.logger.error(`Gemini Chat Error: ${response.status} - ${errText}`);
      throw new HttpException(
        `Gemini API error: ${errText}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (stream) {
      return this.handleStream(
        response.body!,
        'chat',
      ) as AsyncIterable<ChatResponse>;
    }

    const data = (await response.json()) as GeminiResponse;
    return {
      model: targetModel,
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
        'Gemini API key is not configured.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const targetModel = model || 'gemini-1.5-flash';

    const payload: Record<string, unknown> = {
      model: targetModel,
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
        `Gemini Generate Error: ${response.status} - ${errText}`,
      );
      throw new HttpException(
        `Gemini API error: ${errText}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (stream) {
      return this.handleStream(
        response.body!,
        'generate',
      ) as AsyncIterable<GenerateResponse>;
    }

    const data = (await response.json()) as GeminiResponse;
    return {
      model: targetModel,
      created_at: new Date(),
      done: true,
      response: data.choices?.[0]?.message?.content || '',
      prompt_eval_count: data.usage?.prompt_tokens,
      eval_count: data.usage?.completion_tokens,
    } as unknown as GenerateResponse;
  }

  listModels(): Promise<string[]> {
    return Promise.resolve([
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash-exp',
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
              const parsed = JSON.parse(trimmed.slice(6)) as GeminiResponse;
              
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
