import { useState, useRef, useEffect } from 'react';
import { useServices } from '../../presentation/contexts/ServiceContext';
import { useSettingsStore } from '../../presentation/features/settings/store/useSettingsStore';
import { useAIStore } from '../store/useAIStore';

export type Mode = 'EXPLAIN' | 'TRANSLATE';

interface AIHandlerState {
    result: string;
    loading: boolean;
    error: string | null;
    setResult: (v: string) => void;
    setLoading: (v: boolean) => void;
    setError: (v: string | null) => void;
    cancel: () => void;
}

export const useAIHandler = (options: { isGlobal?: boolean } = {}) => {
    const { aiService } = useServices();
    const aiModel = useSettingsStore((s) => s.llmModel);
    const setAiModel = useSettingsStore((s) => s.setLlmModel);

    // Global state from store
    const globalStore = useAIStore();

    // Local state as fallback
    const [localResult, setLocalResult] = useState('');
    const [localLoading, setLocalLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const localAbortController = useRef<AbortController | null>(null);

    const isGlobal = options.isGlobal;

    const state: AIHandlerState = isGlobal ? {
        result: globalStore.result,
        loading: globalStore.loading,
        error: globalStore.error,
        setResult: globalStore.setResult,
        setLoading: globalStore.setLoading,
        setError: globalStore.setError,
        cancel: () => {
            if (globalStore.abortController) {
                globalStore.abortController.abort();
                globalStore.setAbortController(null);
                globalStore.setLoading(false);
            }
        }
    } : {
        result: localResult,
        loading: localLoading,
        error: localError,
        setResult: setLocalResult,
        setLoading: setLocalLoading,
        setError: setLocalError,
        cancel: () => {
            if (localAbortController.current) {
                localAbortController.current.abort();
                localAbortController.current = null;
                setLocalLoading(false);
            }
        }
    };

    const handleAction = async (text: string, mode: Mode, targetLang: string, sourceLang: string = 'Auto', context?: string) => {
        console.log(`[Flux Debug] handleAction START: text="${text}", mode=${mode}, target=${targetLang}`);
        // Cancel previous request
        console.log('[Flux Debug] handleAction: Cancelling previous request');
        state.cancel();

        const controller = new AbortController();
        if (isGlobal) {
            globalStore.setAbortController(controller);
        } else {
            localAbortController.current = controller;
        }

        state.setLoading(true);
        state.setError(null);
        state.setResult('');

        try {
            if (!aiModel) {
                const models = await aiService.getAvailableModels();
                if (models.length > 0) {
                    const preferred = models.find(m => m.includes('llama3') || m.includes('mistral') || m.includes('qwen')) || models[0];
                    aiService.setModel(preferred);
                    setAiModel(preferred);
                }
            } else {
                aiService.setModel(aiModel);
            }

            let response = '';
            let detectedLang: string | undefined;

            if (mode === 'EXPLAIN') {
                response = await aiService.explainText(text, targetLang, context, sourceLang, controller.signal);
            } else {
                const translateResult = await aiService.translateText(text, targetLang, context, sourceLang, controller.signal);
                if (typeof translateResult === 'object' && translateResult !== null) {
                    response = translateResult.response;
                    detectedLang = translateResult.sourceLanguage;
                } else {
                    response = translateResult;
                }
            }
            
            if (controller.signal.aborted) return;

            state.setResult(response);
            if (isGlobal) {
                globalStore.setAbortController(null);
            } else {
                localAbortController.current = null;
            }
            state.setLoading(false);
            return { detectedLang, response };
        } catch (err: unknown) {
            if (controller.signal.aborted) return;
            
            console.error('AI Error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
            state.setError(`Error: ${errorMessage}. Check Host URL.`);
            state.setLoading(false);
            if (isGlobal) {
                globalStore.setAbortController(null);
            } else {
                localAbortController.current = null;
            }
        }
    };

    // Cleanup local controller on unmount
    useEffect(() => {
        return () => {
            if (!isGlobal && localAbortController.current) {
                localAbortController.current.abort();
            }
        };
    }, [isGlobal]);

    return { 
        result: state.result, 
        loading: state.loading, 
        error: state.error, 
        handleAction, 
        setResult: state.setResult, 
        setError: state.setError, 
        cancel: state.cancel,
        reset: isGlobal ? globalStore.reset : () => {
            setLocalResult('');
            setLocalLoading(false);
            setLocalError(null);
        }
    };
};
