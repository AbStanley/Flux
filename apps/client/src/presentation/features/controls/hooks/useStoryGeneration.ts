import { useRef } from 'react';
import type { IAIService } from '../../../../core/interfaces/IAIService';
import type { ContentType, ProficiencyLevel } from '../../../../core/types/AIConfig';
import { defaultClient, getAuthToken } from '../../../../infrastructure/api/api-client';

interface UseStoryGenerationProps {
    aiService: IAIService;
    setText: (text: string) => void;
    setIsGenerating: (isGenerating: boolean) => void;
    sourceLang: string;
    isLearningMode: boolean;
    topic: string;
    proficiencyLevel: ProficiencyLevel;
    contentType: ContentType;
}

export const useStoryGeneration = ({
    aiService,
    setText,
    setIsGenerating,
    sourceLang,
    isLearningMode,
    topic,
    proficiencyLevel,
    contentType
}: UseStoryGenerationProps) => {
    const abortControllerRef = useRef<AbortController | null>(null);

    const generateStory = async () => {
        setIsGenerating(true);
        setText('');

        abortControllerRef.current = new AbortController();

        try {
            const baseUrl = await defaultClient.getActiveBaseUrl();
            const token = await getAuthToken();
            
            const response = await fetch(`${baseUrl}/api/generate-content`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    topic,
                    sourceLanguage: sourceLang,
                    isLearningMode,
                    proficiencyLevel,
                    contentType,
                    model: aiService.getModel(),
                    stream: true,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) throw new Error(`Generation failed: ${response.status}`);

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response stream');

            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean);
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        fullText += data.response ?? '';
                        setText(fullText);
                    } catch { /* skip */ }
                }
            }
        } catch (error: unknown) {
            const errorName = error instanceof Error ? error.name : '';
            const errorMessage = error instanceof Error ? error.message : '';
            if (errorName === 'AbortError' || errorMessage === 'Aborted') {
                console.log('Generation aborted by user');
            } else {
                console.error(error);
                alert("Failed to generate text");
            }
        } finally {
            setIsGenerating(false);
            abortControllerRef.current = null;
        }
    };

    const stopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    return { generateStory, stopGeneration };
};
