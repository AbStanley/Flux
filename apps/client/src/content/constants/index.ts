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
    light: {
        name: 'Light', id: 'light', dot: '#f1f5f9',
        bg: 'rgba(255, 255, 255, 0.85)', bgSolid: '#ffffff',
        surface: '#e2e8f0', surfaceActive: '#cbd5e1',
        text: '#0f172a', textSecondary: '#64748b', textDim: 'rgba(0, 0, 0, 0.4)',
        accent: '#2563eb', accentGlow: 'rgba(37, 99, 235, 0.15)',
        border: 'rgba(0, 0, 0, 0.1)', borderLight: 'rgba(0, 0, 0, 0.05)',
        error: '#dc2626', success: '#16a34a', info: '#1d4ed8',
    },
    nordic: {
        name: 'Nordic', id: 'nordic', dot: '#2e3440',
        bg: 'rgba(46, 52, 64, 0.80)', bgSolid: '#2e3440',
        surface: '#3b4252', surfaceActive: '#434c5e',
        text: '#eceff4', textSecondary: '#d8dee9', textDim: 'rgba(216, 222, 233, 0.5)',
        accent: '#88c0d0', accentGlow: 'rgba(136, 192, 208, 0.2)',
        border: 'rgba(216, 222, 233, 0.15)', borderLight: 'rgba(216, 222, 233, 0.08)',
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
