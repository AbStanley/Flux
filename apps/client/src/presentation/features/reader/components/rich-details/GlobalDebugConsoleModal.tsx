import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { backendAiApi } from '../../../../../infrastructure/api/backend-ai-api';
import { Bug, Copy, Download, AlertTriangle, Check, RefreshCw, Clock } from 'lucide-react';

interface DebugTrace {
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
}

interface GlobalDebugConsoleModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalDebugConsoleModal({ isOpen, onOpenChange }: GlobalDebugConsoleModalProps) {
  const [traces, setTraces] = useState<DebugTrace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<DebugTrace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchTraces = async () => {
    setLoading(true);
    try {
      const data = await backendAiApi.getTraces() as DebugTrace[];
      setTraces(data || []);
      if (data && data.length > 0) {
        setSelectedTrace(data[0]);
      } else {
        setSelectedTrace(null);
      }
      setError('');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTraces();
    }
  }, [isOpen]);

  const handleCopyReport = (data: DebugTrace) => {
    let report = `# FLUX Diagnostic Trace Bug Report\n\n`;
    report += `- **Trace ID:** ${data.id}\n`;
    report += `- **Endpoint:** ${data.endpoint}\n`;
    report += `- **Method:** ${data.method}\n`;
    report += `- **Model:** ${data.model || 'Unknown'}\n`;
    report += `- **Duration:** ${data.durationMs}ms\n`;
    report += `- **Time:** ${data.timestamp}\n`;
    if (data.error) report += `- **Error:** \`${data.error}\`\n`;
    report += `\n### Request Payload\n\`\`\`json\n${JSON.stringify(data.requestPayload, null, 2)}\n\`\`\`\n`;
    report += `\n### Constructed Prompt\n\`\`\`text\n${data.prompt}\n\`\`\`\n`;
    report += `\n### Raw LLM Response\n\`\`\`json\n${data.rawResponse}\n\`\`\`\n`;
    if (data.parsedResponse) {
      report += `\n### Backend Parsed Response\n\`\`\`json\n${JSON.stringify(data.parsedResponse, null, 2)}\n\`\`\`\n`;
    }

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = (data: DebugTrace) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flux_trace_${data.endpoint.replace('/api/', '').replace(/\//g, '_')}_${data.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTraceLabel = (t: DebugTrace) => {
    const payload = (t.requestPayload || {}) as Record<string, unknown>;
    const text = typeof payload.text === 'string'
      ? payload.text
      : typeof payload.word === 'string'
        ? payload.word
        : typeof payload.infinitive === 'string'
          ? payload.infinitive
          : '';
    const cleanLabel = t.endpoint.replace('/api/', '');
    return text ? `"${text.length > 15 ? text.slice(0, 15) + '...' : text}" (${cleanLabel})` : cleanLabel;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl h-[85vh] flex flex-col p-5 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden select-text">
        <DialogHeader className="pb-3 border-b flex flex-row items-center justify-between gap-3 shrink-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Bug className="h-5 w-5 text-primary animate-pulse" />
            Global AI Diagnostics & Network Console
          </DialogTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8 mr-6 rounded-full" onClick={fetchTraces} disabled={loading} title="Refresh Traces">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </DialogHeader>

        {/* Master-Detail Split Screen */}
        <div className="flex-1 flex min-h-0 mt-4 gap-4 overflow-hidden">
          {/* Left Column: Traces Master List (35%) */}
          <div className="w-[35%] border rounded-xl flex flex-col overflow-hidden bg-muted/10">
            <div className="p-3 border-b bg-muted/30 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              Recent Network Traces ({traces.length})
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {error && (
                <div className="p-3 text-xs text-destructive bg-destructive/10 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{error}</span>
                </div>
              )}
              {traces.length === 0 && !loading && !error && (
                <div className="p-8 text-center text-xs text-muted-foreground italic">No traces recorded yet. Trigger lookups or translations to populate.</div>
              )}
              {traces.map((t) => {
                const isSelected = selectedTrace?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTrace(t)}
                    className={`w-full text-left p-3 transition-colors flex flex-col gap-1 text-xs ${isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/30'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${t.error ? 'bg-destructive' : 'bg-green-500'}`} />
                        {getTraceLabel(t)}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{new Date(t.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/85">
                      <span className="font-mono">{t.method}</span>
                      <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {t.durationMs}ms</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detail View (65%) */}
          <div className="w-[65%] flex flex-col overflow-hidden">
            {selectedTrace ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/30 mb-3 shrink-0">
                  <div className="text-xs truncate">
                    <span className="font-bold text-foreground mr-2">Trace ID:</span>
                    <span className="font-mono text-muted-foreground">{selectedTrace.id}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCopyReport(selectedTrace)} className="gap-1 px-2.5 py-1 text-[11px] h-7">
                      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      {copied ? 'Copied' : 'Copy Report'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadJson(selectedTrace)} className="gap-1 px-2.5 py-1 text-[11px] h-7">
                      <Download className="h-3 w-3" />
                      JSON
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-muted/40 border rounded-xl"><p className="text-[9px] text-muted-foreground font-bold uppercase">Model</p><p className="text-xs font-semibold truncate">{selectedTrace.model || 'Unknown'}</p></div>
                    <div className="p-3 bg-muted/40 border rounded-xl"><p className="text-[9px] text-muted-foreground font-bold uppercase">Endpoint</p><p className="text-xs font-semibold truncate">{selectedTrace.endpoint}</p></div>
                    <div className="p-3 bg-muted/40 border rounded-xl"><p className="text-[9px] text-muted-foreground font-bold uppercase">Duration</p><p className="text-xs font-semibold">{selectedTrace.durationMs} ms</p></div>
                  </div>

                  {selectedTrace.error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl font-mono whitespace-pre-wrap">{selectedTrace.error}</div>
                  )}

                  <TraceSection title="1. Request Payload" value={JSON.stringify(selectedTrace.requestPayload, null, 2)} />
                  <TraceSection title="2. System & User Prompt" value={selectedTrace.prompt} />
                  <TraceSection title="3. Raw LLM Output" value={selectedTrace.rawResponse} />
                  {!!selectedTrace.parsedResponse && (
                    <TraceSection title="4. Backend Parsed JSON" value={JSON.stringify(selectedTrace.parsedResponse, null, 2)} />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed rounded-xl bg-muted/5 p-8 text-center text-sm text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mb-2 opacity-50" />
                Select a trace from the history list to view detailed execution logs.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TraceSection({ title, value }: { title: string; value: string }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="border rounded-xl bg-card overflow-hidden">
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between p-2.5 bg-muted/20 border-b hover:bg-muted/40 transition-colors">
        <h4 className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider">{title}</h4>
        <span className="text-[9px] text-muted-foreground font-semibold">{collapsed ? 'Show' : 'Hide'}</span>
      </button>
      {!collapsed && (
        <pre className="p-3 text-xs font-mono overflow-x-auto whitespace-pre bg-muted/5 max-h-60 select-text">
          {value || <span className="italic text-muted-foreground">Empty / Not available</span>}
        </pre>
      )}
    </div>
  );
}
