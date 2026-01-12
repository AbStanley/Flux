import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useServices } from '../../contexts/ServiceContext';
import { cn } from '../../../lib/utils';


interface AIControlsProps {
    isGenerating: boolean;
}

export const AIControls = ({ isGenerating }: AIControlsProps) => {
    const { aiService, setServiceType, currentServiceType } = useServices();
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [modelError, setModelError] = useState(false);

    const refreshModels = useCallback(async () => {
        setIsLoadingModels(true);
        setModelError(false);
        try {
            const models = await aiService.getAvailableModels();
            if (models.length > 0) {
                setAvailableModels(models);

                // Validate current model exists in available models
                const currentModel = aiService.getModel();
                const isValidModel = models.includes(currentModel);

                if (!currentModel || !isValidModel) {
                    // Default to the first available model
                    setServiceType('ollama', { model: models[0] });
                }
            } else {
                setAvailableModels([]);
                setModelError(true);
            }
        } catch (error) {
            console.error("Failed to fetch models:", error);
            setAvailableModels([]);
            setModelError(true);
        } finally {
            setIsLoadingModels(false);
        }
    }, [aiService, setServiceType]);

    useEffect(() => {
        if (currentServiceType === 'ollama') {
            refreshModels();
        }
    }, [currentServiceType, refreshModels]);

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-1 gap-2">
            <span className="uppercase text-xs text-muted-foreground tracking-wider font-semibold">Reader Input</span>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                {currentServiceType === 'ollama' && (
                    <>
                        {modelError || availableModels.length === 0 ? (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-xs text-destructive">
                                    <AlertCircle className="h-3 w-3" />
                                    <span>No models</span>
                                </div>
                                <button
                                    onClick={refreshModels}
                                    disabled={isLoadingModels}
                                    className="p-1 hover:bg-secondary rounded-md"
                                    title="Refresh Models"
                                >
                                    <RefreshCw className={cn("h-3 w-3", isLoadingModels && "animate-spin")} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Select
                                    value={aiService.getModel() || ""}
                                    onValueChange={(val) => setServiceType('ollama', { model: val })}
                                    disabled={isGenerating || isLoadingModels}
                                >
                                    <SelectTrigger className="w-full sm:w-[180px] bg-secondary/30 border-border/50 h-8 sm:h-10 text-xs sm:text-sm">
                                        <SelectValue placeholder="Select Model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <button
                                    onClick={refreshModels}
                                    disabled={isLoadingModels}
                                    className="p-1 hover:bg-secondary rounded-md text-muted-foreground"
                                    title="Refresh Models"
                                >
                                    <RefreshCw className={cn("h-3 w-3", isLoadingModels && "animate-spin")} />
                                </button>
                            </div>
                        )}
                    </>
                )}
                <Select
                    value={currentServiceType}
                    onValueChange={(val) => setServiceType(val as 'mock' | 'ollama')}
                    disabled={isGenerating}
                >
                    <SelectTrigger className="w-full sm:w-[150px] bg-secondary/30 border-border/50 h-8 sm:h-10 text-xs sm:text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ollama">Ollama (Local)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};
