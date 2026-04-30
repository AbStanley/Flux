import { useState, useEffect } from 'react';
import { DEFAULT_THEME } from '../constants';

interface StorageResult {
    fluxAutoSave?: boolean;
    fluxSourceLang?: string;
    fluxTargetLang?: string;
    fluxModel?: string;
    fluxTheme?: string;
    fluxEnabled?: boolean;
    fluxCustomThemes?: any[];
    [key: string]: unknown;
}

interface AIServiceLike {
    setModel(model: string): void;
    getAvailableModels(): Promise<string[]>;
}

const STORAGE_KEYS = [
    'fluxAutoSave',
    'fluxSourceLang',
    'fluxTargetLang',
    'fluxEnabled',
    'fluxModel',
    'fluxTheme',
    'fluxPopupCollapsed',
    'fluxCustomThemes',
] as const;

function persistToStorage(data: Record<string, unknown>) {
    window.chrome?.storage?.local?.set(data);
}

export function useChromeSettings(aiService: AIServiceLike) {
    const [autoSave, setAutoSave] = useState(false);
    const [sourceLang, setSourceLang] = useState('Auto');
    const [targetLang, setTargetLang] = useState('English');
    const [fluxEnabled, setFluxEnabled] = useState(true);
    const [themeId, setThemeId] = useState(DEFAULT_THEME);
    const [selectedModel, setSelectedModel] = useState('');
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [popupCollapsed, setPopupCollapsed] = useState(false);
    const [customThemes, setCustomThemes] = useState<any[]>([]);

    // Fetch available models on mount
    useEffect(() => {
        aiService.getAvailableModels().then(setAvailableModels).catch(() => {});
    }, [aiService]);

    // Load persisted settings + listen for external changes
    useEffect(() => {
        if (!window.chrome?.storage?.local) return;

        window.chrome.storage.local.get([...STORAGE_KEYS], (items) => {
            const result = items as StorageResult;
            if (!result) return;
            if (result.fluxAutoSave !== undefined) setAutoSave(result.fluxAutoSave as boolean);
            if (result.fluxSourceLang) setSourceLang(result.fluxSourceLang as string);
            if (result.fluxTargetLang) setTargetLang(result.fluxTargetLang as string);
            if (result.fluxEnabled !== undefined) setFluxEnabled(result.fluxEnabled as boolean);
            if (result.fluxModel) setSelectedModel(result.fluxModel as string);
            if (result.fluxTheme) setThemeId(result.fluxTheme as string);
            if (result.fluxPopupCollapsed !== undefined) setPopupCollapsed(result.fluxPopupCollapsed as boolean);
            if (Array.isArray(result.fluxCustomThemes)) setCustomThemes(result.fluxCustomThemes);
        });

        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
            if (changes.fluxEnabled) setFluxEnabled(changes.fluxEnabled.newValue as boolean);
            if (changes.fluxTheme) setThemeId(changes.fluxTheme.newValue as string);
            if (changes.fluxCustomThemes) setCustomThemes(changes.fluxCustomThemes.newValue as any[]);
            if (changes.fluxModel) {
                const model = changes.fluxModel.newValue as string;
                setSelectedModel(model);
                if (model) aiService.setModel(model);
            }
        };
        window.chrome.storage.onChanged.addListener(handleStorageChange);
        return () => window.chrome.storage.onChanged.removeListener(handleStorageChange);
    }, [aiService]);

    // Persisting setters — each updates React state + chrome storage
    const persistAutoSave = (enabled: boolean) => {
        setAutoSave(enabled);
        persistToStorage({ fluxAutoSave: enabled });
    };

    const persistSourceLang = (lang: string) => {
        setSourceLang(lang);
        persistToStorage({ fluxSourceLang: lang });
    };

    const persistTargetLang = (lang: string) => {
        setTargetLang(lang);
        persistToStorage({ fluxTargetLang: lang });
    };

    const persistModel = (model: string) => {
        setSelectedModel(model);
        persistToStorage({ fluxModel: model });
    };

    const persistTheme = (id: string) => {
        setThemeId(id);
        persistToStorage({ fluxTheme: id });
    };

    const persistPopupCollapsed = (collapsed: boolean) => {
        setPopupCollapsed(collapsed);
        persistToStorage({ fluxPopupCollapsed: collapsed });
    };

    const swapLanguages = (): { newSource: string; newTarget: string } => {
        const newSource = targetLang;
        const newTarget = sourceLang === 'Auto' ? 'English' : sourceLang;

        setSourceLang(newSource);
        setTargetLang(newTarget);
        persistToStorage({ fluxSourceLang: newSource, fluxTargetLang: newTarget });

        return { newSource, newTarget };
    };

    return {
        autoSave,
        sourceLang,
        targetLang,
        fluxEnabled,
        themeId,
        selectedModel,
        availableModels,
        popupCollapsed,
        customThemes,

        persistAutoSave,
        persistSourceLang,
        persistTargetLang,
        persistModel,
        persistTheme,
        persistPopupCollapsed,
        swapLanguages,
    };
}
