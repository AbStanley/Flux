import { Injectable } from '@nestjs/common';

export interface DebugTrace {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  requestPayload: any;
  model: string;
  prompt: string;
  rawResponse: string;
  parsedResponse?: any;
  error?: string;
  durationMs: number;
}

@Injectable()
export class DebugTraceService {
  private traces = new Map<string, DebugTrace>();
  private traceIds: string[] = [];
  private readonly maxTraces = 50;

  recordTrace(id: string, trace: Partial<DebugTrace>) {
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
      ...trace,
    };

    this.traces.set(id, updated);

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
