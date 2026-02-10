import { useState } from 'react';
import { useServices } from '../../presentation/contexts/ServiceContext';
import { useReaderStore } from '../../presentation/features/reader/store/useReaderStore';

export type Mode = 'EXPLAIN' | 'TRANSLATE';

export const useAIHandler = () => {
    const [result, setResult] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { aiService } = useServices();
    const { aiModel, setAiModel } = useReaderStore();

    const handleAction = async (text: string, mode: Mode, targetLang: string, sourceLang: string = 'Auto') => {
        setLoading(true);
        setError(null);
        setResult('');

        try {
            // If no model is set, try to auto-detect and save it
            if (!aiModel) {
                const models = await aiService.getAvailableModels();
                if (models.length > 0) {
                    const preferred = models.find(m => m.includes('llama3') || m.includes('mistral') || m.includes('qwen')) || models[0];
                    aiService.setModel(preferred);
                    setAiModel(preferred); // Persist it
                }
            } else {
                // Ensure service is using the store's model (ServiceContext should handle this, but double check here)
                aiService.setModel(aiModel);
            }

            let response = '';
            if (mode === 'EXPLAIN') {
                response = await aiService.explainText(text, targetLang, sourceLang);
            } else {
                response = await aiService.translateText(text, targetLang, sourceLang);
            }
            setResult(response);
        } catch (err: unknown) {
            console.error('AI Error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
            setError(`Error: ${errorMessage}. Check Host URL.`);
        } finally {
            setLoading(false);
        }
    };

    return { result, loading, error, handleAction, setResult, setError };
};
