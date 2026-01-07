import { useState } from 'react';
import { OllamaService } from '../../infrastructure/ai/OllamaService';

// Initialize Service
const aiService = new OllamaService(import.meta.env.VITE_OLLAMA_URL);

export type Mode = 'EXPLAIN' | 'TRANSLATE';

export const useAIHandler = () => {
    const [result, setResult] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAction = async (text: string, mode: Mode, lang: string) => {
        setLoading(true);
        setError(null);
        setResult('');

        try {
            let response = '';
            // Ensure model is initialized or set preferred
            const models = await aiService.getAvailableModels();
            if (models.length > 0) {
                const preferred = models.find(m => m.includes('llama3') || m.includes('mistral') || m.includes('qwen')) || models[0];
                aiService.setModel(preferred);
            }

            if (mode === 'EXPLAIN') {
                response = await aiService.explainText(text, lang);
            } else {
                response = await aiService.translateText(text, lang);
            }
            setResult(response);
        } catch (err: any) {
            console.error('AI Error:', err);
            setError(`Error: ${err.message || 'Failed to connect'} `);
        } finally {
            setLoading(false);
        }
    };

    return { result, loading, error, handleAction, setResult, setError };
};
