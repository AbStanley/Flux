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
    link: string;
    linkFg: string;
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
        link: '#3b82f6', linkFg: '#ffffff',
    },
    nordic: {
        name: 'Nordic', id: 'nordic', dot: '#5e81ac',
        bg: 'rgba(36, 41, 51, 0.88)', bgSolid: '#242933',
        surface: '#2e3440', surfaceActive: '#3b4252',
        text: '#eceff4', textSecondary: '#9aabbf', textDim: 'rgba(154, 171, 191, 0.5)',
        accent: '#5e81ac', accentGlow: 'rgba(94, 129, 172, 0.25)',
        border: 'rgba(94, 129, 172, 0.2)', borderLight: 'rgba(94, 129, 172, 0.1)',
        error: '#bf616a', success: '#a3be8c', info: '#81a1c1',
        link: '#88c0d0', linkFg: '#2e3440',
    },
    ivory: {
        name: 'Ivory', id: 'ivory', dot: '#f5f0e8',
        bg: 'rgba(42, 36, 28, 0.88)', bgSolid: '#2a241c',
        surface: '#3d3529', surfaceActive: '#504636',
        text: '#f5f0e8', textSecondary: '#c4b99a', textDim: 'rgba(245, 240, 232, 0.45)',
        accent: '#d4a853', accentGlow: 'rgba(212, 168, 83, 0.2)',
        border: 'rgba(212, 168, 83, 0.15)', borderLight: 'rgba(212, 168, 83, 0.08)',
        error: '#e07461', success: '#8fad6a', info: '#d4a853',
        link: '#d4a853', linkFg: '#ffffff',
    },
    sunset: {
        name: 'Sunset', id: 'sunset', dot: '#1a1025',
        bg: 'rgba(26, 16, 37, 0.80)', bgSolid: '#1a1025',
        surface: '#2d1b3d', surfaceActive: '#3d2952',
        text: '#faf0ff', textSecondary: '#c4a8d8', textDim: 'rgba(250, 240, 255, 0.5)',
        accent: '#f97316', accentGlow: 'rgba(249, 115, 22, 0.2)',
        border: 'rgba(250, 240, 255, 0.12)', borderLight: 'rgba(250, 240, 255, 0.06)',
        error: '#fb7185', success: '#4ade80', info: '#fbbf24',
        link: '#f97316', linkFg: '#ffffff',
    },
    'rose-pine': {
        name: 'Rose Pine', id: 'rose-pine', dot: '#191724',
        bg: 'rgba(25, 23, 36, 0.9)', bgSolid: '#191724',
        surface: '#1f1d2e', surfaceActive: '#26233a',
        text: '#e0def4', textSecondary: '#908caa', textDim: 'rgba(144, 140, 170, 0.5)',
        accent: '#ebbcba', accentGlow: 'rgba(235, 188, 186, 0.2)',
        border: 'rgba(144, 140, 170, 0.15)', borderLight: 'rgba(144, 140, 170, 0.08)',
        error: '#eb6f92', success: '#9ccfd8', info: '#c4a7e7',
        link: '#9ccfd8', linkFg: '#191724',
    },
    evergreen: {
        name: 'Evergreen', id: 'evergreen', dot: '#f0f5f0',
        bg: 'rgba(240, 245, 240, 0.95)', bgSolid: '#f0f5f0',
        surface: '#e2ede2', surfaceActive: '#d4e5d4',
        text: '#2d4a3e', textSecondary: '#4a6b5d', textDim: 'rgba(74, 107, 93, 0.4)',
        accent: '#4a7c59', accentGlow: 'rgba(74, 124, 89, 0.15)',
        border: 'rgba(74, 124, 89, 0.12)', borderLight: 'rgba(74, 124, 89, 0.06)',
        error: '#c05a5a', success: '#5a8c5a', info: '#5a7ca0',
        link: '#4a7c59', linkFg: '#ffffff',
    },
    moonlight: {
        name: 'Moonlight', id: 'moonlight', dot: '#161a2e',
        bg: 'rgba(22, 26, 46, 0.88)', bgSolid: '#161a2e',
        surface: '#1b2036', surfaceActive: '#222845',
        text: '#c8d0e0', textSecondary: '#7a88a9', textDim: 'rgba(122, 136, 169, 0.45)',
        accent: '#65d9ef', accentGlow: 'rgba(101, 217, 239, 0.2)',
        border: 'rgba(101, 217, 239, 0.12)', borderLight: 'rgba(101, 217, 239, 0.06)',
        error: '#ff5c57', success: '#5af78e', info: '#57c7ff',
        link: '#65d9ef', linkFg: '#161a2e',
    },
    light: {
        name: 'Light', id: 'light', dot: '#f8fafc',
        bg: 'rgba(248, 250, 252, 0.95)', bgSolid: '#f8fafc',
        surface: '#f1f5f9', surfaceActive: '#e2e8f0',
        text: '#334155', textSecondary: '#64748b', textDim: 'rgba(100, 116, 139, 0.5)',
        accent: '#3b82f6', accentGlow: 'rgba(59, 130, 246, 0.1)',
        border: 'rgba(0, 0, 0, 0.08)', borderLight: 'rgba(0, 0, 0, 0.04)',
        error: '#ef4444', success: '#22c55e', info: '#3b82f6',
        link: '#3b82f6', linkFg: '#ffffff',
    }
};

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
