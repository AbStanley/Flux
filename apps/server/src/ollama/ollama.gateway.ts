import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { OllamaClientService } from './services/ollama-client.service';
import { Message, ChatResponse, GenerateResponse } from 'ollama';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ws',
})
export class OllamaGateway {
  private readonly logger = new Logger(OllamaGateway.name);

  constructor(private readonly client: OllamaClientService) {}

  @SubscribeMessage('chat')
  async handleChat(
    @MessageBody() body: { model: string; messages: Message[] },
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      const model = await this.client.ensureModel(body.model);
      const stream = (await this.client.chat(model, body.messages, true)) as AsyncIterable<ChatResponse>;

      for await (const part of stream) {
        socket.emit('chat:token', {
          content: part.message?.content ?? '',
          done: part.done ?? false,
        });
      }

      socket.emit('chat:done');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Stream failed';
      this.logger.error(`WebSocket chat error: ${msg}`);
      socket.emit('chat:error', { error: msg });
    }
  }

  @SubscribeMessage('generate')
  async handleGenerate(
    @MessageBody() body: { model: string; prompt: string },
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      const model = await this.client.ensureModel(body.model);
      const stream = (await this.client.generate(model, body.prompt, true)) as AsyncIterable<GenerateResponse>;

      for await (const part of stream) {
        socket.emit('generate:token', {
          content: part.response ?? '',
          done: part.done ?? false,
        });
      }

      socket.emit('generate:done');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Stream failed';
      this.logger.error(`WebSocket generate error: ${msg}`);
      socket.emit('generate:error', { error: msg });
    }
  }
}
