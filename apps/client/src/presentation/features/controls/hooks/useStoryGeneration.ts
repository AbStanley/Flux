import { useRef } from 'react';
import type { IAIService } from '../../../../core/interfaces/IAIService';

import { getStoryPrompt } from '../../../../infrastructure/ai/prompts/GenerationPrompts';


interface UseStoryGenerationProps {
    aiService: IAIService;
    setText: (text: string) => void;
    setIsGenerating: (isGenerating: boolean) => void;
    sourceLang: string;
    isLearningMode: boolean;
    topic: string;
    proficiencyLevel: string;
}

export const useStoryGeneration = ({
    aiService,
    setText,
    setIsGenerating,
    sourceLang,
    isLearningMode,
    topic,
    proficiencyLevel
}: UseStoryGenerationProps) => {
    const abortControllerRef = useRef<AbortController | null>(null);

    const generateStory = async () => {
        setIsGenerating(true);
        // Clear previous text to start fresh
        setText('');

        abortControllerRef.current = new AbortController();

        try {
            const prompt = getStoryPrompt(sourceLang, isLearningMode, topic, proficiencyLevel);

            await aiService.generateText(prompt, {
                signal: abortControllerRef.current.signal,
                onProgress: (_chunk: string, fullText: string) => {

                    setText(fullText);
                }
            });
        } catch (error: any) {
            if (error.name === 'AbortError' || error.message === 'Aborted') {
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
