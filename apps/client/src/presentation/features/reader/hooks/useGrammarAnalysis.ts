import { useState, useCallback } from 'react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { defaultClient } from '../../../../infrastructure/api/api-client';

export interface GrammarAnalysisResult {
    sentence: string;
    translation: string;
    grammar: {
        word: string;
        translation: string;
        partOfSpeech: string;
        details: string;
        colorGroup: string;
    }[];
}

interface UseGrammarAnalysisReturn {
    analyze: (text: string, sourceLang: string, targetLang: string) => Promise<GrammarAnalysisResult | null>;
    prefetch: (text: string, sourceLang: string, targetLang: string) => void;
    isLoading: boolean;
    error: string | null;
    analysisResult: GrammarAnalysisResult | null;
    clearResult: () => void;
}

// Global cache to persist across hook re-renders
const analysisCache = new Map<string, Promise<GrammarAnalysisResult>>();

export const useGrammarAnalysis = (): UseGrammarAnalysisReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<GrammarAnalysisResult | null>(null);
    const llmModel = useSettingsStore((state) => state.llmModel);

    const getCacheKey = (text: string, sourceLang: string, targetLang: string, model: string) => {
        return `${text.trim()}|${sourceLang}|${targetLang}|${model}`;
    };

    const performAnalysis = async (text: string, sourceLang: string, targetLang: string, model: string): Promise<GrammarAnalysisResult> => {
        try {
            const data = await defaultClient.post<GrammarAnalysisResult>('/api/analyze-grammar', {
                text,
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
                model: model || ''
            });

            // Validate structure to prevent UI crashes
            if (!data || !Array.isArray(data.grammar)) {
                throw new Error("Invalid response: 'grammar' field is missing or invalid");
            }

            return data;
        } catch (error) {
            console.error('Grammar analysis failed:', error);
            throw error;
        }
    };

    // Better concurreny handling with Ref
    const activeRequestIdRef = useState<{ current: string | null }>({ current: null })[0];

    const analyzeSafe = useCallback(async (text: string, sourceLang: string, targetLang: string) => {
        const currentModel = llmModel || '';
        const key = getCacheKey(text, sourceLang, targetLang, currentModel);
        activeRequestIdRef.current = key;

        setIsLoading(true);
        setError(null);

        // Immediate cache check for instant render
        const cachedPromise = analysisCache.get(key);
        // If we have a resolved value (simulated check), we might render faster, but awaiting promise is fine.

        try {
            let promise = cachedPromise;
            if (!promise) {
                promise = performAnalysis(text, sourceLang, targetLang, currentModel);
                analysisCache.set(key, promise);
                promise.catch(() => analysisCache.delete(key));
            }

            const data = await promise;

            if (activeRequestIdRef.current === key) {
                setAnalysisResult(data);
                setIsLoading(false);
            }
            return data;
        } catch (err) {
            if (activeRequestIdRef.current === key) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                setIsLoading(false);
            }
            return null;
        }
    }, [llmModel, activeRequestIdRef]);

    const prefetch = useCallback((text: string, sourceLang: string, targetLang: string) => {
        const currentModel = llmModel || '';
        const key = getCacheKey(text, sourceLang, targetLang, currentModel);

        if (!analysisCache.has(key)) {
            console.log(`Prefetching grammar analysis for: "${text.substring(0, 20)}..."`);
            const promise = performAnalysis(text, sourceLang, targetLang, currentModel);
            analysisCache.set(key, promise);
            promise.catch(() => analysisCache.delete(key));
        }
    }, [llmModel]);

    const clearResult = useCallback(() => {
        activeRequestIdRef.current = null;
        setAnalysisResult(null);
        setError(null);
        setIsLoading(false);
    }, [activeRequestIdRef]);

    return {
        analyze: analyzeSafe,
        prefetch,
        isLoading,
        error,
        analysisResult,
        clearResult,
    };
};
