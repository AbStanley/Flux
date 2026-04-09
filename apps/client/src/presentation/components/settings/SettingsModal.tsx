import { useState, useEffect, useRef } from 'react';
import { Settings, Plus, Pencil, Trash2, Download, Loader2, Cpu } from 'lucide-react';
import { defaultClient } from '@/infrastructure/api/api-client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { useTheme } from '@/presentation/providers/useTheme';
import type { Theme } from '@/presentation/providers/ThemeProvider';
import {
    useSettingsStore,
    FONT_FAMILY_MAP,
    FONT_SIZE_MAP,
    type ReaderFont,
    type FontSize,
    type CustomTheme
} from '@/presentation/features/settings/store/useSettingsStore';
import { ThemeBuilder } from './ThemeBuilder';

const THEMES: { value: Theme; label: string; preview: string }[] = [
    { value: 'light', label: 'Light', preview: 'bg-blue-50 text-slate-700' },
    { value: 'dark', label: 'Dark', preview: 'bg-slate-800 text-white' },
    { value: 'nordic', label: 'Nordic', preview: 'bg-slate-900 text-sky-400' },
    { value: 'cream', label: 'Cream', preview: 'bg-amber-100 text-amber-900' },
    { value: 'sunset', label: 'Sunset', preview: 'bg-orange-200 text-orange-950' },
];

const FONTS: { value: ReaderFont; label: string }[] = [
    { value: 'system', label: 'System Default' },
    { value: 'merriweather', label: 'Merriweather' },
    { value: 'literata', label: 'Literata' },
    { value: 'lora', label: 'Lora' },
    { value: 'crimson-pro', label: 'Crimson Pro' },
    { value: 'eb-garamond', label: 'EB Garamond' },
    { value: 'inter', label: 'Inter' },
    { value: 'roboto', label: 'Roboto' },
];

const SIZES: { value: FontSize; label: string }[] = [
    { value: 'small', label: 'S' },
    { value: 'medium', label: 'M' },
    { value: 'large', label: 'L' },
    { value: 'xl', label: 'XL' },
];

export function SettingsModal({ open, onOpenChange, hideTrigger }: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    hideTrigger?: boolean;
} = {}) {
    const { theme, setTheme } = useTheme();
    const { font, fontSize, setFont, setFontSize, customThemes, removeCustomTheme } = useSettingsStore();

    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [editingThemeId, setEditingThemeId] = useState<string | null>(null);

    const handleEditTheme = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingThemeId(id);
        setIsBuilderOpen(true);
    };

    const handleDeleteTheme = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this theme?')) {
            removeCustomTheme(id);
            if (theme === id) setTheme('light');
        }
    };

    const handleCreateTheme = () => {
        setEditingThemeId(null);
        setIsBuilderOpen(true);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                {!hideTrigger && (
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full w-10 h-10 bg-background/50 hover:bg-background/80 backdrop-blur-sm border border-border/50"
                        >
                            <Settings className="h-5 w-5" />
                            <span className="sr-only">Settings</span>
                        </Button>
                    </DialogTrigger>
                )}
                <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>Reader Settings</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Theme Selection */}
                        <ThemeSection
                            theme={theme}
                            setTheme={setTheme}
                            customThemes={customThemes}
                            onEdit={handleEditTheme}
                            onDelete={handleDeleteTheme}
                            onCreate={handleCreateTheme}
                        />

                        {/* Font Selection */}
                        <FontSection font={font} setFont={setFont} />

                        {/* Font Size Selection */}
                        <SizeSection fontSize={fontSize} setFontSize={setFontSize} />

                        {/* Ollama Model Manager */}
                        <ModelManager />
                    </div>
                </DialogContent>
            </Dialog>

            <ThemeBuilder
                isOpen={isBuilderOpen}
                onClose={() => setIsBuilderOpen(false)}
                editThemeId={editingThemeId}
            />
        </>
    );
}

function ThemeSection({
    theme,
    setTheme,
    customThemes,
    onEdit,
    onDelete,
    onCreate
}: {
    theme: Theme;
    setTheme: (t: Theme) => void;
    customThemes: CustomTheme[];
    onEdit: (id: string, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onCreate: () => void;
}) {
    return (
        <div>
            <h3 className="text-xs md:text-sm font-medium mb-1.5 md:mb-3">Theme</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 md:gap-2">
                {THEMES.map((t) => (
                    <button
                        key={t.value}
                        onClick={() => setTheme(t.value)}
                        className={`flex flex-col items-center gap-1 md:gap-2 p-2 md:p-3 rounded-lg border-2 transition-all ${theme === t.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                            }`}
                    >
                        <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full ${t.preview} border`} />
                        <span className="text-[10px] md:text-xs truncate max-w-full">{t.label}</span>
                    </button>
                ))}

                {customThemes.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`relative group flex flex-col items-center gap-1 md:gap-2 p-2 md:p-3 rounded-lg border-2 transition-all ${theme === t.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                            }`}
                    >
                        <div
                            className="w-6 h-6 md:w-8 md:h-8 rounded-full border"
                            style={{ background: `hsl(${t.colors.background})`, borderColor: `hsl(${t.colors.border})` }}
                        />
                        <span className="text-[10px] md:text-xs truncate max-w-full w-full text-center" title={t.name}>{t.name}</span>

                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded shadow-sm">
                            <span
                                role="button"
                                onClick={(e) => onEdit(t.id, e)}
                                className="p-1 hover:text-primary cursor-pointer"
                                title="Edit"
                            >
                                <Pencil className="w-3 h-3" />
                            </span>
                            <span
                                role="button"
                                onClick={(e) => onDelete(t.id, e)}
                                className="p-1 hover:text-destructive cursor-pointer"
                                title="Delete"
                            >
                                <Trash2 className="w-3 h-3" />
                            </span>
                        </div>
                    </button>
                ))}

                <button
                    onClick={onCreate}
                    className="flex flex-col items-center justify-center gap-1 md:gap-2 p-2 md:p-3 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
                    title="Create custom theme"
                >
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center border border-dashed">
                        <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] md:text-xs">New</span>
                </button>
            </div>
        </div>
    );
}

function FontSection({ font, setFont }: { font: ReaderFont; setFont: (f: ReaderFont) => void }) {
    return (
        <div>
            <h3 className="text-xs md:text-sm font-medium mb-1.5 md:mb-3">Font</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 md:gap-2 max-h-48 overflow-y-auto">
                {FONTS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFont(f.value)}
                        style={{ fontFamily: FONT_FAMILY_MAP[f.value] }}
                        className={`p-2 md:p-3 rounded-lg border-2 text-left transition-all ${font === f.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                            }`}
                    >
                        <span className="text-xs md:text-sm">{f.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function SizeSection({ fontSize, setFontSize }: { fontSize: FontSize; setFontSize: (s: FontSize) => void }) {
    return (
        <div>
            <h3 className="text-xs md:text-sm font-medium mb-1.5 md:mb-3">Font Size</h3>
            <div className="flex gap-1 md:gap-2">
                {SIZES.map((s) => (
                    <button
                        key={s.value}
                        onClick={() => setFontSize(s.value)}
                        style={{ fontSize: FONT_SIZE_MAP[s.value] }}
                        className={`flex-1 h-8 md:h-10 min-w-[2.5rem] text-xs rounded-md border transition-all ${fontSize === s.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                            }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

interface OllamaModel {
    name: string;
    size: number;
    modified_at: string;
}

function ModelManager() {
    const [models, setModels] = useState<OllamaModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [pullName, setPullName] = useState('');
    const [pulling, setPulling] = useState(false);
    const [pullProgress, setPullProgress] = useState(0);
    const [pullStatus, setPullStatus] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const fetchModels = () => {
        setLoading(true);
        defaultClient.get<{ models: OllamaModel[] }>('/api/tags')
            .then((data) => setModels(data?.models || []))
            .catch(() => setModels([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchModels(); }, []);

    const handlePull = async () => {
        const name = pullName.trim();
        if (!name || pulling) return;
        setPulling(true);
        setPullProgress(0);
        setPullStatus('Starting...');

        try {
            const baseUrl = defaultClient.getBaseUrl();
            abortRef.current = new AbortController();
            const res = await fetch(`${baseUrl}/api/models/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: name }),
                signal: abortRef.current.signal,
            });

            if (!res.ok) throw new Error(`Failed: ${res.status}`);

            const reader = res.body?.getReader();
            if (!reader) throw new Error('No stream');
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        setPullStatus(data.status || '');
                        if (data.total && data.completed) {
                            setPullProgress(Math.round((data.completed / data.total) * 100));
                        }
                    } catch { /* skip */ }
                }
            }

            setPullName('');
            fetchModels();
        } catch (e) {
            if (e instanceof Error && e.name !== 'AbortError') {
                setPullStatus(`Error: ${e.message}`);
            }
        } finally {
            setPulling(false);
            abortRef.current = null;
        }
    };

    const handleDelete = async (name: string) => {
        if (deleting) return;
        setDeleting(name);
        try {
            await fetch(`${defaultClient.getBaseUrl()}/api/models`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: name }),
            });
            setModels((prev) => prev.filter((m) => m.name !== name));
        } catch { /* skip */ }
        finally { setDeleting(null); }
    };

    const formatSize = (bytes: number) => {
        if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
        if (bytes > 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
        return `${bytes} B`;
    };

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
