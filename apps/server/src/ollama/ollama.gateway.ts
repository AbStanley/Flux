import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { OllamaClientService } from './services/ollama-client.service';
import { Message } from 'ollama';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/ws',
})
export class OllamaGateway implements OnGatewayInit {
  private readonly logger = new Logger(OllamaGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly client: OllamaClientService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    server.use((socket, next) => {
      const ip = socket.handshake.address;
      const isLocalhost =
        ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
      if (isLocalhost) return next();

      const token = (socket.handshake.auth as { token?: string })?.token;
      if (!token) return next(new Error('Authentication required'));

      try {
        (socket.data as Record<string, unknown>)['user'] =
          this.jwtService.verify(token) as unknown;
        next();
      } catch {
        next(new Error('Invalid token'));
      }
    });
  }

  @SubscribeMessage('chat')
  async handleChat(
    @MessageBody() body: { model: string; messages: Message[] },
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      const model = await this.client.ensureModel(body.model);
      const stream = await this.client.chat(model, body.messages, true);

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
      const stream = await this.client.generate(model, body.prompt, true);

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
