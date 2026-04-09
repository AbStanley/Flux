export const LANGUAGES = [
    'English', 'Spanish', 'Russian', 'French', 'German', 'Italian',
    'Portuguese', 'Japanese', 'Chinese',
];

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
    text: string;
    textSecondary: string;
    textDim: string;
    accent: string;
    accentGlow: string;
    border: string;
    borderLight: string;
    error: string;
    success: string;
    info: string;
    dot: string;
}

export const THEMES: Record<string, FluxTheme> = {
    dark: {
        name: 'Dark', id: 'dark', dot: '#0f172a',
        bg: 'rgba(15, 23, 42, 0.75)', bgSolid: '#0f172a',
        surface: '#334155', surfaceActive: '#475569',
        text: '#f8fafc', textSecondary: '#94a3b8', textDim: 'rgba(255, 255, 255, 0.5)',
        accent: '#3b82f6', accentGlow: 'rgba(59, 130, 246, 0.2)',
        border: 'rgba(255, 255, 255, 0.1)', borderLight: 'rgba(255, 255, 255, 0.05)',
        error: '#f87171', success: '#4ade80', info: '#bae6fd',
    },
    ivory: {
        name: 'Ivory', id: 'ivory', dot: '#f5f0e8',
        bg: 'rgba(42, 36, 28, 0.88)', bgSolid: '#2a241c',
        surface: '#3d3529', surfaceActive: '#504636',
        text: '#f5f0e8', textSecondary: '#c4b99a', textDim: 'rgba(245, 240, 232, 0.45)',
        accent: '#d4a853', accentGlow: 'rgba(212, 168, 83, 0.2)',
        border: 'rgba(212, 168, 83, 0.15)', borderLight: 'rgba(212, 168, 83, 0.08)',
        error: '#e07461', success: '#8fad6a', info: '#d4a853',
    },
    nordic: {
        name: 'Nordic', id: 'nordic', dot: '#5e81ac',
        bg: 'rgba(36, 41, 51, 0.88)', bgSolid: '#242933',
        surface: '#2e3440', surfaceActive: '#3b4252',
        text: '#eceff4', textSecondary: '#9aabbf', textDim: 'rgba(154, 171, 191, 0.5)',
        accent: '#5e81ac', accentGlow: 'rgba(94, 129, 172, 0.25)',
        border: 'rgba(94, 129, 172, 0.2)', borderLight: 'rgba(94, 129, 172, 0.1)',
        error: '#bf616a', success: '#a3be8c', info: '#81a1c1',
    },
    sunset: {
        name: 'Sunset', id: 'sunset', dot: '#1a1025',
        bg: 'rgba(26, 16, 37, 0.80)', bgSolid: '#1a1025',
        surface: '#2d1b3d', surfaceActive: '#3d2952',
        text: '#faf0ff', textSecondary: '#c4a8d8', textDim: 'rgba(250, 240, 255, 0.5)',
        accent: '#f97316', accentGlow: 'rgba(249, 115, 22, 0.2)',
        border: 'rgba(250, 240, 255, 0.12)', borderLight: 'rgba(250, 240, 255, 0.06)',
        error: '#fb7185', success: '#4ade80', info: '#fbbf24',
    },
};

export const DEFAULT_THEME = 'dark';
