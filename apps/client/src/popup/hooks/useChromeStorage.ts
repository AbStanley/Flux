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
    rememberedUsers: string[];
    toggleEnabled: () => void;
    persistTheme: (id: string) => void;
    persistModel: (model: string) => void;
    persistEmail: (email: string) => void;
    forgetUser: (email: string) => void;
    customThemes: any[];
}

export function useChromeStorage(defaultTheme: string): PopupStorageState {
    const [enabled, setEnabled] = useState(true);
    const [themeId, setThemeId] = useState(defaultTheme);
    const [selectedModel, setSelectedModel] = useState('');
    const [email, setEmail] = useState('');
    const [rememberedUsers, setRememberedUsers] = useState<string[]>([]);
    const [customThemes, setCustomThemes] = useState<any[]>([]);
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current) return;
        loaded.current = true;
        if (window.chrome?.storage?.local) {
            window.chrome.storage.local.get(
                ['fluxEnabled', 'flux_last_email', 'fluxTheme', 'fluxModel', 'flux_remembered_users', 'fluxCustomThemes'],
                (result) => {
                    if (result.fluxEnabled !== undefined) setEnabled(result.fluxEnabled as boolean);
                    if (result.flux_last_email) setEmail(result.flux_last_email as string);
                    if (result.fluxTheme) setThemeId(result.fluxTheme as string);
                    if (result.fluxModel) setSelectedModel(result.fluxModel as string);
                    if (Array.isArray(result.flux_remembered_users)) setRememberedUsers(result.flux_remembered_users as string[]);
                    if (Array.isArray(result.fluxCustomThemes)) setCustomThemes(result.fluxCustomThemes);
                },
            );
        }

        // Listen for changes (e.g. if custom themes are added in side panel)
        const handleChanges = (changes: Record<string, { newValue?: unknown }>) => {
            if (changes.fluxCustomThemes?.newValue) {
                setCustomThemes(changes.fluxCustomThemes.newValue as any[]);
            }
            if (changes.fluxTheme?.newValue) {
                setThemeId(changes.fluxTheme.newValue as string);
            }
        };
        window.chrome.storage.onChanged.addListener(handleChanges);
        return () => window.chrome.storage.onChanged.removeListener(handleChanges);
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
        // Also add to remembered users list
        const updated = [em, ...rememberedUsers.filter(e => e !== em)].slice(0, 5);
        setRememberedUsers(updated);
        window.chrome?.storage?.local?.set({ flux_remembered_users: updated });
    };

    const forgetUser = (em: string) => {
        const updated = rememberedUsers.filter(e => e !== em);
        setRememberedUsers(updated);
        window.chrome?.storage?.local?.set({ flux_remembered_users: updated });
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
        rememberedUsers,
        toggleEnabled,
        persistTheme,
        persistModel,
        persistEmail,
        forgetUser,
        customThemes,
    };
}
