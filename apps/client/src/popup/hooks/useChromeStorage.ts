import { useState, useEffect, useRef } from 'react';

interface PopupStorageState {
    enabled: boolean;
    setEnabled: (v: boolean) => void;
    themeId: string;
    setThemeId: (id: string) => void;
    selectedModel: string;
    setSelectedModel: (m: string) => void;
    email: string;
    setEmail: (e: string) => void;
    toggleEnabled: () => void;
    persistTheme: (id: string) => void;
    persistModel: (model: string) => void;
    persistEmail: (email: string) => void;
}

export function useChromeStorage(defaultTheme: string): PopupStorageState {
    const [enabled, setEnabled] = useState(true);
    const [themeId, setThemeId] = useState(defaultTheme);
    const [selectedModel, setSelectedModel] = useState('');
    const [email, setEmail] = useState('');
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current) return;
        loaded.current = true;
        if (window.chrome?.storage?.local) {
            window.chrome.storage.local.get(
                ['fluxEnabled', 'flux_last_email', 'fluxTheme', 'fluxModel'],
                (result) => {
                    if (result.fluxEnabled !== undefined) setEnabled(result.fluxEnabled as boolean);
                    if (result.flux_last_email) setEmail(result.flux_last_email as string);
                    if (result.fluxTheme) setThemeId(result.fluxTheme as string);
                    if (result.fluxModel) setSelectedModel(result.fluxModel as string);
                },
            );
        }
    }, []);

    const persistTheme = (id: string) => {
        setThemeId(id);
        window.chrome?.storage?.local?.set({ fluxTheme: id });
    };

    const persistModel = (model: string) => {
        setSelectedModel(model);
        window.chrome?.storage?.local?.set({ fluxModel: model });
    };

    const persistEmail = (em: string) => {
        window.chrome?.storage?.local?.set({ flux_last_email: em });
    };

    const toggleEnabled = () => {
        const next = !enabled;
        setEnabled(next);
        window.chrome?.storage?.local?.set({ fluxEnabled: next });
    };

    return {
        enabled, setEnabled,
        themeId, setThemeId,
        selectedModel, setSelectedModel,
        email, setEmail,
        toggleEnabled,
        persistTheme,
        persistModel,
        persistEmail,
    };
}
