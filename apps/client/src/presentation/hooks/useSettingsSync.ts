import { useEffect, useRef } from 'react';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { useReaderStore } from '../features/reader/store/useReaderStore';
import { useSettingsStore, type CustomTheme } from '../features/settings/store/useSettingsStore';
import { useTheme } from '../providers/useTheme';
import type { Theme } from '../providers/ThemeProvider';
import { usersApi } from '@/infrastructure/api/users';

export function useSettingsSync() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    
    // Languages
    const sourceLang = useReaderStore((state) => state.sourceLang);
    const targetLang = useReaderStore((state) => state.targetLang);
    
    // Themes
    const { theme, setTheme } = useTheme();
    const customThemes = useSettingsStore((state) => state.customThemes);

    const isInitialLoadDone = useRef(false);
    
    // Store last known server state to avoid echoing back
    const lastSynced = useRef({
        theme: '',
        sourceLang: '',
        targetLang: '',
        customThemesRef: '',
    });

    // Initial load from server
    useEffect(() => {
        if (!isAuthenticated) {
            isInitialLoadDone.current = false;
            return;
        }

        // Only fetch once per authentication session
        if (isInitialLoadDone.current) return;

        const fetchSettings = async () => {
            try {
                const settings = await usersApi.getSettings();
                
                // Track if we need to push local state up to the server because server is empty
                let needsPush = false;
                
                const currentSource = useReaderStore.getState().sourceLang;
                const currentTarget = useReaderStore.getState().targetLang;
                const currentCustomThemes = useSettingsStore.getState().customThemes;

                // Sync server -> local, or fallback to tracking local -> server
                if (settings.sourceLang) {
                    useReaderStore.getState().setSourceLang(settings.sourceLang);
                } else if (currentSource) {
                    needsPush = true;
                }

                if (settings.targetLang) {
                    useReaderStore.getState().setTargetLang(settings.targetLang);
                } else if (currentTarget) {
                    needsPush = true;
                }

                if (settings.theme) {
                    setTheme(settings.theme as Theme);
                } else if (theme) {
                    needsPush = true;
                }

                if (settings.customThemes && Array.isArray(settings.customThemes) && settings.customThemes.length > 0) {
                    useSettingsStore.getState().setCustomThemes(settings.customThemes as CustomTheme[]);
                } else if (currentCustomThemes.length > 0) {
                    needsPush = true;
                }

                // If server had no data but client has data, push client data up immediately
                if (needsPush) {
                    const pushPayload = {
                        theme: theme as string,
                        sourceLang: currentSource,
                        targetLang: currentTarget,
                        customThemes: currentCustomThemes,
                    };
                    usersApi.updateSettings(pushPayload).catch(console.error);
                    
                    lastSynced.current = {
                        theme: pushPayload.theme,
                        sourceLang: pushPayload.sourceLang,
                        targetLang: pushPayload.targetLang,
                        customThemesRef: JSON.stringify(pushPayload.customThemes),
                    };
                } else {
                    // Update tracking with whatever we just synced from the server
                    lastSynced.current = {
                        theme: settings.theme || theme || '',
                        sourceLang: settings.sourceLang || currentSource || '',
                        targetLang: settings.targetLang || currentTarget || '',
                        customThemesRef: JSON.stringify(settings.customThemes || currentCustomThemes || []),
                    };
                }
            } catch (error) {
                console.error('[SettingsSync] Failed to fetch settings', error);
            } finally {
                isInitialLoadDone.current = true;
            }
        };

        fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]); // Deliberately omitting setTheme and Zustand setters to prevent infinite fetch loops!

    // Sync to server when local state changes
    useEffect(() => {
        if (!isAuthenticated || !isInitialLoadDone.current) return;

        const currentCustomThemesStr = JSON.stringify(customThemes);

        // Check if anything actually changed from what the server already knows
        const hasChanges = 
            theme !== lastSynced.current.theme ||
            sourceLang !== lastSynced.current.sourceLang ||
            targetLang !== lastSynced.current.targetLang ||
            currentCustomThemesStr !== lastSynced.current.customThemesRef;

        if (!hasChanges) return;

        // Update tracking ref
        lastSynced.current = {
            theme: theme as string,
            sourceLang,
            targetLang,
            customThemesRef: currentCustomThemesStr,
        };

        usersApi.updateSettings({
            theme: theme as string,
            sourceLang,
            targetLang,
            customThemes,
        }).catch((err) => console.error('[SettingsSync] Failed to update settings', err));
        
    }, [theme, sourceLang, targetLang, customThemes, isAuthenticated]);
}
