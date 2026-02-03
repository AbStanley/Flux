import { useRef } from 'react';
import type { IAIService } from '../../../../core/interfaces/IAIService';

// We just define this type locally or import from interface if available, 
// strictly speaking it should be shared or just any.
// But since the service method handles it, we can just pass it through.
type ContentType = any;

interface UseStoryGenerationProps {
    aiService: IAIService;
    setText: (text: string) => void;
    setIsGenerating: (isGenerating: boolean) => void;
    sourceLang: string;
    isLearningMode: boolean;
    topic: string;
    proficiencyLevel: string;
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
        // Clear previous text to start fresh
        setText('');

        abortControllerRef.current = new AbortController();

        try {
            // Updated to use the new server-side generation
            const generatedText = await aiService.generateContent({
                topic,
                sourceLanguage: sourceLang,
                isLearningMode,
                proficiencyLevel,
                contentType
            });

            // Set full text at once since streaming might not be fully supported yet 
            // or handled differently in the new service
            setText(generatedText);

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
