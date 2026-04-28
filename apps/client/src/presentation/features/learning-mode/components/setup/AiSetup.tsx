import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore } from '../../../settings/store/useSettingsStore';
import { serverAIService } from '@/infrastructure/ai/ServerAIService';
import { setApiClientBaseUrl } from '@/infrastructure/api/api-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { ArrowRightLeft, RefreshCw, Pencil } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { LanguageSelector } from './LanguageSelector';
import { Input } from '@/presentation/components/ui/input';
import { cn } from '@/lib/utils';
import { Switch } from '@/presentation/components/ui/switch';

export const AiSetup = () => {
    const { config, updateConfig, availableLangs, isLoadingLangs } = useGameStore();
    const { llmModel, setLlmModel, aiHost: globalAiHost, setAiHost: setGlobalAiHost } = useSettingsStore();
    
    const [models, setModels] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isManualInput, setIsManualInput] = useState(false);

    const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime?.id;

    const refreshModels = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const m = await serverAIService.getAvailableModels();
            const unique = Array.from(new Set(m));
            setModels(unique);
            if (unique.length > 0 && (!llmModel || !unique.includes(llmModel))) {
                setLlmModel(unique[0]);
            }
        } catch (err) {
            console.error('Failed to fetch models:', err);
            setError('Could not connect to Ollama. Make sure it is running.');
            if (!llmModel) setIsManualInput(true);
        } finally {
            setLoading(false);
        }
    }, [llmModel, setLlmModel]);

    useEffect(() => {
        if (globalAiHost) setApiClientBaseUrl(globalAiHost);
        refreshModels();
    }, [globalAiHost, refreshModels]);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-card p-4 rounded-xl border border-border">
                <h3 className="font-medium mb-3 flex items-center gap-2 text-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    AI Configuration
                </h3>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                        <LanguageSelector
                            label="Foreign Language 🌍"
                            value={config.sourceLang}
                            onChange={(val) => updateConfig({ sourceLang: val })}
                            disabled={loading || isLoadingLangs}
                            options={availableLangs}
                        />
                        <div className="flex justify-center md:pb-2">
                            <Button size="icon" variant="outline" className="rounded-full shadow-sm hover:scale-110 transition-transform"
                                onClick={() => updateConfig({ sourceLang: config.targetLang, targetLang: config.sourceLang })}
                                title="Swap Languages">
                                <ArrowRightLeft className="w-4 h-4" />
                            </Button>
                        </div>
                        <LanguageSelector
                            label="Native Language 🏠"
                            value={config.targetLang}
                            onChange={(val) => updateConfig({ targetLang: val })}
                            disabled={loading || isLoadingLangs}
                            options={availableLangs}
                        />
                    </div>

                    {config.mode === 'multiple-choice' && (
                        <div className="flex items-center space-x-3 px-1 mt-2">
                            <Switch 
                                checked={config.mixMode} 
                                onCheckedChange={(checked) => updateConfig({ mixMode: checked })} 
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground">Mix Mode</span>
                                <span className="text-xs text-muted-foreground">Randomly swap prompt and answer directions during gameplay</span>
                            </div>
                        </div>
                    )}

                    <div className="h-px bg-border my-2" />

                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground flex justify-between">
                                Server URL
                                {!isExtension && <span className="text-[10px] text-green-500 font-mono bg-green-500/10 px-1.5 py-0.5 rounded">WEB APP MODE</span>}
                            </label>
                            <Input
                                value={!isExtension ? '' : (globalAiHost || 'http://localhost')}
                                onChange={(e) => { setGlobalAiHost(e.target.value); setApiClientBaseUrl(e.target.value); }}
                                placeholder={!isExtension ? "Auto (Relative Path)" : "http://localhost"}
                                disabled={!isExtension}
                                className={cn("bg-[var(--input-background)] font-mono text-xs mt-1", !isExtension && "opacity-50 cursor-not-allowed")}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-muted-foreground">Model</label>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={refreshModels} className="h-7 w-7 p-0 rounded-full" disabled={loading}>
                                    <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setIsManualInput(!isManualInput)} className={cn("h-7 w-7 p-0 rounded-full", isManualInput && "text-primary")}>
                                    <Pencil className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>

                        {error && <div className="text-xs text-destructive">{error}</div>}

                        {isManualInput ? (
                            <Input value={llmModel} onChange={(e) => setLlmModel(e.target.value)} placeholder="Enter model name" className="bg-[var(--input-background)]" />
                        ) : (
                            <Select value={llmModel} onValueChange={setLlmModel} disabled={loading || (models.length === 0 && !llmModel)}>
                                <SelectTrigger className="bg-[var(--input-background)]">
                                    <SelectValue placeholder={loading ? "Loading..." : "Select AI Model"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-muted-foreground">Topic</label>
                            <Input value={config.aiTopic || ''} onChange={(e) => updateConfig({ aiTopic: e.target.value })} placeholder="e.g., Business, Travel..." className="bg-[var(--input-background)]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-muted-foreground">Level</label>
                            <Select value={config.aiLevel || 'intermediate'} onValueChange={(val: 'beginner' | 'intermediate' | 'advanced') => updateConfig({ aiLevel: val })}>
                                <SelectTrigger className="bg-[var(--input-background)]">
                                    <SelectValue />
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
        </div>
    );
};

