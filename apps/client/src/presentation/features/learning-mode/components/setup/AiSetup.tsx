import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { ollamaService } from '@/infrastructure/ai/OllamaService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { RefreshCw, Pencil } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { cn } from '@/lib/utils';

export const AiSetup = () => {
    const { config, updateConfig } = useGameStore();
    const [models, setModels] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isManualInput, setIsManualInput] = useState(false);

    const fetchModels = useCallback(async () => {
        // Apply stored host URL before fetching (handles hydration timing)
        if (config.aiHost) {
            ollamaService.setBaseUrl(config.aiHost);
        }

        setLoading(true);
        setError(null);
        try {
            const available = await ollamaService.getAvailableModels();
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
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="font-medium mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                    AI Configuration
                </h3>

                <div className="space-y-4">
                    {/* Model Selection */}
                    <div className="space-y-1.5">
                        <div className="space-y-1.5 mb-3">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">AI Host URL</label>
                            <Input
                                value={config.aiHost || 'http://localhost:11434'}
                                onChange={(e) => {
                                    updateConfig({ aiHost: e.target.value });
                                    // Make sure immediate service update happens if needed, or rely on it being set before calls
                                    ollamaService.setBaseUrl(e.target.value);
                                }}
                                placeholder="http://localhost:11434"
                                className="bg-white dark:bg-slate-700 font-mono text-xs"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Model</label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={fetchModels}
                                className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
                                disabled={loading}
                                title="Refresh Models"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsManualInput(!isManualInput)}
                                className={cn("h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full", isManualInput ? "text-violet-500" : "")}
                                title="Toggle Manual Input"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </Button>
                        </div>

                        {error && (
                            <div className="text-xs text-orange-500">{error}</div>
                        )}

                        {isManualInput ? (
                            <Input
                                value={config.aiModel || ''}
                                onChange={(e) => updateConfig({ aiModel: e.target.value })}
                                placeholder="Enter model name (e.g., llama2, mistral)"
                                className="bg-white dark:bg-slate-700"
                            />
                        ) : (
                            <Select
                                value={config.aiModel}
                                onValueChange={(val) => updateConfig({ aiModel: val })}
                                disabled={loading || (models.length === 0 && !config.aiModel)}
                            >
                                <SelectTrigger className="bg-white dark:bg-slate-700">
                                    <SelectValue placeholder={loading ? "Loading models..." : (models.length === 0 ? "No models found" : "Select AI Model")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {models.map(model => (
                                        <SelectItem key={model} value={model}>{model}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <p className="text-xs text-slate-500">
                            Required: A model capable of JSON output (e.g. llama3, mistral).
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                            Topic
                        </label>
                        <input
                            type="text"
                            value={config.aiTopic || ''}
                            onChange={(e) => updateConfig({ aiTopic: e.target.value })}
                            placeholder="e.g., Business, Travel, Airport..."
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            The AI will generate vocabulary based on this topic.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Level</label>
                        <Select
                            value={config.aiLevel || 'intermediate'}
                            onValueChange={(val: 'beginner' | 'intermediate' | 'advanced') => updateConfig({ aiLevel: val })}
                        >
                            <SelectTrigger className="bg-white dark:bg-slate-700">
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
