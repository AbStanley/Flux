import { ChatResponse, GenerateResponse } from 'ollama';
import { Message } from './ollama.interfaces';

export interface AiClient {
  chat(
    model: string,
    messages: Message[],
    stream?: boolean,
    signal?: AbortSignal,
    traceId?: string,
  ): Promise<ChatResponse | AsyncIterable<ChatResponse>>;

  generate(
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
    traceId?: string,
  ): Promise<GenerateResponse | AsyncIterable<GenerateResponse>>;

  listModels(): Promise<string[]>;
}
