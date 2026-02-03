import { useState } from 'react';
import { ServerAIService } from '../../infrastructure/ai/ServerAIService';
import { useReaderStore } from '../../presentation/features/reader/store/useReaderStore';

// Initialize Service (Default, will be updated)
const aiService = new ServerAIService('http://localhost:3002/api');

export type Mode = 'EXPLAIN' | 'TRANSLATE';

export const useAIHandler = () => {
    const [result, setResult] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { aiModel, setAiModel } = useReaderStore();

    const handleAction = async (text: string, mode: Mode, lang: string) => {
        setLoading(true);
        setError(null);
        setResult('');

        try {
            // Update Service Config from Store
            // if (aiHost) {
            //    aiService.setBaseUrl(aiHost); // aiHost was for Ollama direct. ServerAIService uses fixed API URL usually.
            // }
            // If model is set in store, use it.
            if (aiModel) {
                aiService.setModel(aiModel);
            }

            let response = '';

            // If no model is set, try to auto-detect and save it
            if (!aiModel) {
                const models = await aiService.getAvailableModels();
                if (models.length > 0) {
                    const preferred = models.find(m => m.includes('llama3') || m.includes('mistral') || m.includes('qwen')) || models[0];
                    aiService.setModel(preferred);
                    setAiModel(preferred); // Persist it
                }
            }

            if (mode === 'EXPLAIN') {
                response = await aiService.explainText(text, lang);
            } else {
                response = await aiService.translateText(text, lang);
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
