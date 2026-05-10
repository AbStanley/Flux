import { LANGUAGES as CORE_LANGUAGES } from '@/core/constants/languages';

export const LANGUAGES = CORE_LANGUAGES;


export const UI_CONSTANTS = {
    POPUP_WIDTH: 320,
    POPUP_COLLAPSED_WIDTH: 240,
    Z_INDEX: 2147483647,
    TRANSITION_DRAGGING: 'none',
    TRANSITION_DEFAULT: 'all 0.1s ease-out',
};

export interface FluxTheme {
    name: string;
    id: string;
    bg: string;
    bgSolid: string;
    surface: string;
    surfaceActive: string;
    muted: string;
    mutedForeground: string;
    text: string;
    textSecondary: string;
    textDim: string;
    accent: string;
    accentForeground: string;
    accentGlow: string;
    border: string;
    borderLight: string;
    error: string;
    errorForeground: string;
    success: string;
    successForeground: string;
    info: string;
    dot: string;
    link: string;
    linkFg: string;
    selectionFg: string;
}

import { THEME_PRESETS, deriveTokens, customThemeToFluxTheme } from '@/lib/color-derive';
import { BUILT_IN_THEME_TOKENS } from '@/lib/theme-presets';

export const THEMES: Record<string, FluxTheme> = THEME_PRESETS.reduce((acc, preset) => {
    const tokens = BUILT_IN_THEME_TOKENS[preset.id] || deriveTokens(preset.seeds);
    acc[preset.id] = customThemeToFluxTheme({
        id: preset.id,
        name: preset.label,
        colors: tokens
    });
    return acc;
}, {} as Record<string, FluxTheme>);

export const DEFAULT_THEME = 'dark';

export const TRACK_COLORS = [
    '#FFFF00', // yellow — classic subtitle color
    '#00FFFF', // cyan
    '#FF69B4', // hot pink
    '#7CFC00', // lawn green
    '#FF8C00', // dark orange
    '#DDA0DD', // plum
    '#87CEEB', // sky blue
    '#FFD700', // gold
];

export const SUBTITLE_OFFSET_STEP = 100; // ms
