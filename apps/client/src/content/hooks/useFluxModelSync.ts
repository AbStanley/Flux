import { useEffect, useRef } from 'react';
import { useSettingsStore, type SettingsState } from '../../presentation/features/settings/store/useSettingsStore';
import type { IAIService } from '../../core/interfaces/IAIService';

export function useFluxModelSync(selectedModel: string | undefined, aiService: IAIService, cancel: () => void) {
    const setAiModel = useSettingsStore((s: SettingsState) => s.setLlmModel);
    const lastModelRef = useRef<string | null>(null);

    useEffect(() => {
        if (selectedModel) {
            if (lastModelRef.current !== selectedModel) {
                cancel();
                lastModelRef.current = selectedModel;
            }
            aiService.setModel(selectedModel);
            setAiModel(selectedModel);
        }
    }, [selectedModel, aiService, setAiModel, cancel]);
}
