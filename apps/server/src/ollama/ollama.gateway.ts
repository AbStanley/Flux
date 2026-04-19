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

      // Stash the stream so `chat:cancel` can abort the Ollama generation
      // instead of just letting tokens keep arriving after the user
      // clicked Stop.
      const socketData = socket.data as Record<string, unknown>;
      socketData['activeChatStream'] = stream;

      try {
        for await (const part of stream) {
          socket.emit('chat:token', {
            content: part.message?.content ?? '',
            done: part.done ?? false,
          });
        }
        socket.emit('chat:done');
      } finally {
        delete socketData['activeChatStream'];
      }
    } catch (e) {
      // Ignore abort — it's the expected path when the user cancels.
      if (e instanceof Error && /abort/i.test(e.message)) {
        socket.emit('chat:done');
        return;
      }
      const msg = e instanceof Error ? e.message : 'Stream failed';
      this.logger.error(`WebSocket chat error: ${msg}`);
      socket.emit('chat:error', { error: msg });
    }
  }

  @SubscribeMessage('chat:cancel')
  handleChatCancel(@ConnectedSocket() socket: Socket) {
    const socketData = socket.data as Record<string, unknown>;
    const stream = socketData['activeChatStream'] as
      | { abort?: () => void }
      | undefined;
    if (stream?.abort) {
      try {
        stream.abort();
      } catch (e) {
        this.logger.warn(`Chat cancel failed: ${String(e)}`);
      }
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
