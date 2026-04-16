import { useEffect, useState } from "react"
import { ThemeProviderContext } from "./ThemeProviderContext"
import { useSettingsStore } from "../features/settings/store/useSettingsStore"

export type Theme = "dark" | "nordic" | "light" | "cream" | "sunset" | "rose-pine" | "evergreen" | "moonlight" | "system" | string

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

export type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

/** Map extension theme IDs to web app theme names */
const EXTENSION_TO_WEBAPP_THEME: Record<string, Theme> = {
    dark: "dark",
    ivory: "cream",
    nordic: "nordic",
    sunset: "sunset",
}

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "reader-ui-theme",
}: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )
    const customThemes = useSettingsStore(state => state.customThemes);

    // Sync theme from extension popup → side panel
    useEffect(() => {
        const isExtension = window.location.protocol === 'chrome-extension:';
        if (!isExtension || !window.chrome?.storage?.onChanged) return;

        // Load initial theme from extension storage
        window.chrome.storage.local.get(['fluxTheme'], (result: Record<string, unknown>) => {
            const extTheme = result.fluxTheme as string | undefined;
            if (extTheme && EXTENSION_TO_WEBAPP_THEME[extTheme]) {
                const mapped = EXTENSION_TO_WEBAPP_THEME[extTheme];
                localStorage.setItem(storageKey, mapped);
                setThemeState(mapped);
            }
        });

        // Listen for theme changes from extension popup
        const handleChange = (changes: Record<string, { newValue?: unknown }>) => {
            if (changes.fluxTheme?.newValue) {
                const mapped = EXTENSION_TO_WEBAPP_THEME[changes.fluxTheme.newValue as string];
                if (mapped) {
                    localStorage.setItem(storageKey, mapped);
                    setThemeState(mapped);
                }
            }
        };
        window.chrome.storage.onChanged.addListener(handleChange);
        return () => window.chrome.storage.onChanged.removeListener(handleChange);
    }, [storageKey]);

    useEffect(() => {
        const root = window.document.documentElement
        const styleId = "custom-theme-styles"
        let styleTag = document.getElementById(styleId)

        if (!styleTag) {
            styleTag = document.createElement("style")
            styleTag.id = styleId
            document.head.appendChild(styleTag)
        }

        root.classList.remove("light", "dark", "nordic", "cream", "sunset", "rose-pine", "evergreen", "moonlight")
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
        },
    }

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

