import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useServices } from '../../contexts/ServiceContext';

interface AIControlsProps {
    isGenerating: boolean;
}

export const AIControls: React.FC<AIControlsProps> = ({ isGenerating }) => {
    const { aiService, setServiceType, currentServiceType } = useServices();
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    useEffect(() => {
        if (currentServiceType === 'ollama') {
            aiService.getAvailableModels().then(models => {
                if (models.length > 0) {
                    setAvailableModels(models);

                    // Validate current model exists in available models
                    const currentModel = (aiService as any).model;
                    const isValidModel = models.includes(currentModel);

                    if (!currentModel || !isValidModel) {
                        // Default to the first available model
                        setServiceType('ollama', { model: models[1] || models[0] });
                    }
                }
            });
        }
    }, [aiService, currentServiceType, setServiceType]);

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-1 gap-2">
            <span className="uppercase text-xs text-muted-foreground tracking-wider font-semibold">Reader Input</span>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {currentServiceType === 'ollama' && (
                    <Select
                        value={((aiService as any).model) || ""} // Type casting for now
                        onValueChange={(val) => setServiceType('ollama', { model: val })}
                        disabled={isGenerating}
                    >
                        <SelectTrigger className="w-full sm:w-[180px] bg-secondary/30 border-border/50 h-8 sm:h-10 text-xs sm:text-sm">
                            <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableModels.length > 0 ? (
                                availableModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)
                            ) : (
                                <>
                                    <SelectItem value="llama2">llama2 (Default)</SelectItem>
                                    <SelectItem value="mistral">mistral</SelectItem>
                                </>
                            )}
                        </SelectContent>
                    </Select>
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
                        <SelectItem value="mock">Mock AI</SelectItem>
                        <SelectItem value="ollama">Ollama (Local)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};
