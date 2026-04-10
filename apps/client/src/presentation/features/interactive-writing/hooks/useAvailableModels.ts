import { useState, useEffect } from 'react';
import { backendAiApi } from '@/infrastructure/api/backend-ai-api';

export function useAvailableModels() {
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [modelsLoadFailed, setModelsLoadFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        backendAiApi
            .listModels()
            .then((res) => {
                if (cancelled) return;
                setModelsLoadFailed(false);
                setAvailableModels(res.models?.map((m) => m.name) ?? []);
            })
            .catch(() => {
                if (!cancelled) {
                    setAvailableModels([]);
                    setModelsLoadFailed(true);
                }
            });
        return () => { cancelled = true; };
    }, []);

    return { availableModels, modelsLoadFailed };
}
