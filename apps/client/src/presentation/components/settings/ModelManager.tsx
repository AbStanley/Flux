import { Trash2, Download, Loader2, Cpu } from 'lucide-react';
import { useModelManager, formatSize } from './hooks/useModelManager';

export function ModelManager() {
    const {
        models, loading,
        pullName, setPullName, pulling, pullProgress, pullStatus,
        deleting, handlePull, handleDelete,
    } = useModelManager();

    return (
        <div>
            <h3 className="text-xs md:text-sm font-medium mb-1.5 md:mb-3 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                Ollama Models
            </h3>

            {loading ? (
                <div className="flex items-center justify-center py-4 text-muted-foreground text-xs">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...
                </div>
            ) : models.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No models installed.</p>
            ) : (
                <div className="space-y-1 mb-3 max-h-40 overflow-y-auto">
                    {models.map((m) => (
                        <div key={m.name} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs group">
                            <div className="min-w-0">
                                <p className="font-medium truncate">{m.name}</p>
                                <p className="text-muted-foreground">{formatSize(m.size)}</p>
                            </div>
                            <button
                                onClick={() => handleDelete(m.name)}
                                disabled={deleting === m.name}
                                className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0 ml-2"
                                title="Delete model"
                            >
                                {deleting === m.name
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Trash2 className="w-3.5 h-3.5" />
                                }
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="space-y-2">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={pullName}
                        onChange={(e) => setPullName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePull()}
                        placeholder="e.g. llama3, mistral, gemma2..."
                        disabled={pulling}
                        className="flex-1 rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                    <button
                        onClick={handlePull}
                        disabled={pulling || !pullName.trim()}
                        className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                        {pulling
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Download className="w-3.5 h-3.5" />
                        }
                        Pull
                    </button>
                </div>

                {pulling && (
                    <div className="space-y-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300 rounded-full"
                                style={{ width: `${pullProgress}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{pullStatus}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
