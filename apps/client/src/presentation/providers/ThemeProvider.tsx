import { useEffect, useState } from "react"
import { ThemeProviderContext } from "./ThemeProviderContext"
import { useSettingsStore, type CustomTheme } from "../features/settings/store/useSettingsStore"

export type Theme = "dark" | "nordic" | "light" | "cream" | "sunset" | "rose-pine" | "evergreen" | "ember" | "system" | string

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

export type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
}



export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "reader-ui-theme",
}: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )
    const [extCustomThemes, setExtCustomThemes] = useState<CustomTheme[]>([]);
    const [hydrated, setHydrated] = useState(() => useSettingsStore.persist.hasHydrated());
    const customThemesFromStore = useSettingsStore(state => state.customThemes);
    
    // Use store themes once hydrated, otherwise use fast-loaded extension themes
    const customThemes = hydrated ? customThemesFromStore : extCustomThemes;

    // Track hydration of settings store
    useEffect(() => {
        const unsub = useSettingsStore.persist.onFinishHydration(() => {
            setHydrated(true);
        });
        return unsub;
    }, []);

    // Sync theme from extension popup → side panel
    useEffect(() => {
        if (!window.chrome?.storage?.local) return;

        // Load initial theme AND custom themes from extension storage
        window.chrome.storage.local.get(['fluxTheme', 'fluxCustomThemes'], (result: Record<string, unknown>) => {
            const extTheme = result.fluxTheme as string | undefined;
            if (extTheme) {
                localStorage.setItem(storageKey, extTheme);
                setThemeState(extTheme);
            }

            const storedCustom = result.fluxCustomThemes as CustomTheme[] | undefined;
            if (storedCustom) {
                setExtCustomThemes(storedCustom);
            }
        });

        // Listen for theme changes from extension popup/content scripts
        const handleChange = (changes: Record<string, chrome.storage.StorageChange>) => {
            if (changes.fluxTheme?.newValue) {
                const extTheme = changes.fluxTheme.newValue as string;
                localStorage.setItem(storageKey, extTheme);
                setThemeState(extTheme);
            }
            if (changes.fluxCustomThemes?.newValue) {
                setExtCustomThemes(changes.fluxCustomThemes.newValue as CustomTheme[]);
            }
        };
        window.chrome.storage.onChanged.addListener(handleChange);
        return () => window.chrome.storage.onChanged.removeListener(handleChange);
    }, [storageKey]);

    // Sync custom themes array TO extension storage whenever they change (only from side panel)
    useEffect(() => {
        if (window.chrome?.storage?.local && hydrated) {
            window.chrome.storage.local.set({ fluxCustomThemes: customThemesFromStore });
        }
    }, [customThemesFromStore, hydrated]);

    useEffect(() => {
        const root = window.document.documentElement
        const styleId = "custom-theme-styles"
        let styleTag = document.getElementById(styleId)

        if (!styleTag) {
            styleTag = document.createElement("style")
            styleTag.id = styleId
            document.head.appendChild(styleTag)
        }

        root.classList.remove("light", "dark", "nordic", "cream", "sunset", "rose-pine", "evergreen", "ember", "harvest", "ultraviolet", "sandcastle", "sage", "bauhaus", "espresso")
        // Clear custom styles
        styleTag.textContent = "";

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light"

            root.classList.add(systemTheme)
            return
        }

        if (theme.startsWith('custom-')) {
            const customTheme = customThemes.find(t => t.id === theme);
            if (customTheme) {
                const cssVariables = Object.entries(customTheme.colors)
                    .map(([key, value]) => `--${key}: ${value};`)
                    .join('\n');

                styleTag.textContent = `:root {\n${cssVariables}\n}`;
                return;
            }
        }

        root.classList.add(theme)
    }, [theme, customThemes])

    const value = {
        theme,
        setTheme: (newTheme: Theme) => {
            localStorage.setItem(storageKey, newTheme)
            setThemeState(newTheme)
            
            // PROPAGATE to extension storage so popup and overlay update too
            if (window.chrome?.storage?.local) {
                window.chrome.storage.local.set({ fluxTheme: newTheme });
            }
        },
    }

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}
