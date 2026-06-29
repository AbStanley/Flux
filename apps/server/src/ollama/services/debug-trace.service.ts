import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface DebugTrace {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  requestPayload: unknown;
  model: string;
  prompt: string;
  rawResponse: string;
  parsedResponse?: unknown;
  error?: string;
  durationMs: number;
  userId?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

@Injectable()
export class DebugTraceService {
  private readonly logger = new Logger(DebugTraceService.name);
  private traces = new Map<string, DebugTrace>();
  private traceIds: string[] = [];
  private readonly maxTraces = 50;

  constructor(private readonly prisma: PrismaService) {}

  async recordTrace(id: string, trace: Partial<DebugTrace>) {
    if (!id) return;

    const existing = this.traces.get(id);
    const updated: DebugTrace = {
      id,
      timestamp: existing?.timestamp || new Date().toISOString(),
      endpoint: trace.endpoint ?? existing?.endpoint ?? '',
      method: trace.method ?? existing?.method ?? 'POST',
      requestPayload: trace.requestPayload ?? existing?.requestPayload ?? null,
      model: trace.model ?? existing?.model ?? '',
      prompt: trace.prompt ?? existing?.prompt ?? '',
      rawResponse: trace.rawResponse ?? existing?.rawResponse ?? '',
      parsedResponse:
        trace.parsedResponse !== undefined
          ? trace.parsedResponse
          : existing?.parsedResponse,
      error: trace.error ?? existing?.error,
      durationMs: trace.durationMs ?? existing?.durationMs ?? 0,
      userId: trace.userId !== undefined ? trace.userId : existing?.userId,
      promptTokens:
        trace.promptTokens !== undefined
          ? trace.promptTokens
          : existing?.promptTokens,
      completionTokens:
        trace.completionTokens !== undefined
          ? trace.completionTokens
          : existing?.completionTokens,
      totalTokens:
        trace.totalTokens !== undefined
          ? trace.totalTokens
          : existing?.totalTokens,
    };

    this.traces.set(id, updated);

    // If new tokens are recorded and we have a userId, update the database!
    if (updated.userId && trace.totalTokens && trace.totalTokens > 0) {
      try {
        const userDb = await this.prisma.user.findUnique({
          where: { id: updated.userId },
          select: { lastAiRequestAt: true },
        });

        if (userDb) {
          const now = new Date();
          const lastRequest = new Date(userDb.lastAiRequestAt);
          const isNewDay =
            now.getUTCDate() !== lastRequest.getUTCDate() ||
            now.getUTCMonth() !== lastRequest.getUTCMonth() ||
            now.getUTCFullYear() !== lastRequest.getUTCFullYear();

          await this.prisma.user.update({
            where: { id: updated.userId },
            data: {
              tokensTotal: { increment: trace.totalTokens },
              tokensToday: isNewDay
                ? trace.totalTokens
                : { increment: trace.totalTokens },
            },
          });
        }
      } catch (err) {
        this.logger.error(
          `Failed to update user token counters: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    if (!existing) {
      this.traceIds.push(id);
      if (this.traceIds.length > this.maxTraces) {
        const oldestId = this.traceIds.shift();
        if (oldestId) {
          this.traces.delete(oldestId);
        }
      }
    }
  }

  getTrace(id: string): DebugTrace | undefined {
    return this.traces.get(id);
  }

  getAllTraces(): DebugTrace[] {
    return this.traceIds.map((id) => this.traces.get(id)!).reverse();
  }
}
