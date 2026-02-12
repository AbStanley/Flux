import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { serverAIService } from '@/infrastructure/ai/ServerAIService'; // Updated import
import { setApiClientBaseUrl } from '@/infrastructure/api/api-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { ArrowRightLeft, RefreshCw, Pencil } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { LanguageSelector } from './LanguageSelector';
import { Input } from '@/presentation/components/ui/input';
import { cn } from '@/lib/utils';

export const AiSetup = () => {
    const { config, updateConfig } = useGameStore();
    const [models, setModels] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isManualInput, setIsManualInput] = useState(false);

    // Detect if we are in a Chrome Extension environment
    const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime?.id;

    const fetchModels = useCallback(async () => {
        // If config.aiHost is empty/undefined, we still want to set it (to empty string) 
        // to reset any previous manual configuration.
        const urlToSet = config.aiHost || '';

        setApiClientBaseUrl(urlToSet);

        setLoading(true);
        setError(null);
        try {
            const available = await serverAIService.getAvailableModels();
            // deduplicate
            const unique = Array.from(new Set(available));
            setModels(unique);

            // Auto-select first if none selected
            if (unique.length > 0 && !config.aiModel) {
                updateConfig({ aiModel: unique[0] });
            }
            // Keep current model even if not in the fetched list (might be manually entered)
        } catch (err) {
            console.error(err);
            setError("Could not auto-fetch models. You can enter one manually.");
            // Don't clear models if we fail, just show error
            if (!config.aiModel) {
                // If nothing selected, maybe default to llama2?
                // updateConfig({ aiModel: 'llama2' });
                setIsManualInput(true);
            }
        } finally {
            setLoading(false);
        }
    }, [config.aiModel, config.aiHost, updateConfig]);

    // Re-fetch models when component mounts or when aiHost changes
    useEffect(() => {
        fetchModels();
    }, [fetchModels, config.aiHost]);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-card p-4 rounded-xl border border-border">
                <h3 className="font-medium mb-3 flex items-center gap-2 text-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    AI Configuration
                </h3>

                <div className="space-y-4">
                    {/* Language Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                        <LanguageSelector
                            label="Foreign Language 🌍"
                            value={config.sourceLang}
                            onChange={(val) => updateConfig({ sourceLang: val })}
                            disabled={loading}
                        />

                        <div className="flex justify-center md:pb-2">
                            <Button
                                size="icon"
                                variant="outline"
                                className="rounded-full shadow-sm hover:scale-110 transition-transform"
                                onClick={() => updateConfig({
                                    sourceLang: config.targetLang,
                                    targetLang: config.sourceLang
                                })}
                                title="Swap Languages"
                            >
                                <ArrowRightLeft className="w-4 h-4" />
                            </Button>
                        </div>

                        <LanguageSelector
                            label="Native Language 🏠"
                            value={config.targetLang}
                            onChange={(val) => updateConfig({ targetLang: val })}
                            disabled={loading}
                        />
                    </div>

                    <div className="h-px bg-border my-2" />

                    {/* Model Selection */}
                    <div className="space-y-1.5">
                        <div className="space-y-1.5 mb-3">
                            <label className="text-sm font-medium text-muted-foreground">
                                Server URL
                                {!isExtension && <span className="ml-2 text-[10px] text-green-500 font-mono bg-green-500/10 px-1.5 py-0.5 rounded">WEB APP MODE</span>}
                            </label>
                            <Input
                                value={!isExtension ? '' : (config.aiHost || 'http://localhost:3000')}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    updateConfig({ aiHost: val });

                                    setApiClientBaseUrl(val);
                                }}
                                placeholder={!isExtension ? "Auto (Relative Path)" : "http://localhost:3000"}
                                disabled={!isExtension}
                                className={cn("bg-[var(--input-background)] font-mono text-xs", !isExtension && "opacity-50 cursor-not-allowed")}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                {!isExtension
                                    ? "Managed automatically by the Web App."
                                    : "If using Docker/Remote, use the machine's IP (e.g. http://192.168.1.5:3000)"}
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-muted-foreground">Model</label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={fetchModels}
                                className="h-6 w-6 p-0 hover:bg-accent rounded-full"
                                disabled={loading}
                                title="Refresh Models"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsManualInput(!isManualInput)}
                                className={cn("h-6 w-6 p-0 hover:bg-accent rounded-full", isManualInput ? "text-primary" : "")}
                                title="Toggle Manual Input"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </Button>
                        </div>

                        {error && (
                            <div className="text-xs text-destructive">{error}</div>
                        )}

                        {isManualInput ? (
                            <Input
                                value={config.aiModel || ''}
                                onChange={(e) => updateConfig({ aiModel: e.target.value })}
                                placeholder="Enter model name (e.g., llama2, mistral)"
                                className="bg-[var(--input-background)]"
                            />
                        ) : (
                            <Select
                                value={config.aiModel}
                                onValueChange={(val) => updateConfig({ aiModel: val })}
                                disabled={loading || (models.length === 0 && !config.aiModel)}
                            >
                                <SelectTrigger className="bg-[var(--input-background)]">
                                    <SelectValue placeholder={loading ? "Loading models..." : (models.length === 0 ? "No models found" : "Select AI Model")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {models.map(model => (
                                        <SelectItem key={model} value={model}>{model}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Required: A model capable of JSON output (e.g. llama3, mistral).
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-muted-foreground">
                            Topic
                        </label>
                        <input
                            type="text"
                            value={config.aiTopic || ''}
                            onChange={(e) => updateConfig({ aiTopic: e.target.value })}
                            placeholder="e.g., Business, Travel, Airport..."
                            className="w-full px-3 py-2 rounded-lg border border-input bg-[var(--input-background)] text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            The AI will generate vocabulary based on this topic.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-muted-foreground">Level</label>
                        <Select
                            value={config.aiLevel || 'intermediate'}
                            onValueChange={(val: 'beginner' | 'intermediate' | 'advanced') => updateConfig({ aiLevel: val })}
                        >
                            <SelectTrigger className="bg-[var(--input-background)]">
                                <SelectValue placeholder="Select Level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
};
