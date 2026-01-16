import { useEffect, useState } from "react"
import { ThemeProviderContext } from "./ThemeProviderContext"
import { useSettingsStore } from "../features/settings/store/useSettingsStore"

export type Theme = "dark" | "nordic" | "light" | "cream" | "sunset" | "system" | string

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
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )
    const customThemes = useSettingsStore(state => state.customThemes);

    useEffect(() => {
        const root = window.document.documentElement
        const styleId = "custom-theme-styles"
        let styleTag = document.getElementById(styleId)

        if (!styleTag) {
            styleTag = document.createElement("style")
            styleTag.id = styleId
            document.head.appendChild(styleTag)
        }

        root.classList.remove("light", "dark", "nordic", "cream", "sunset")
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
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
    }

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

