import { hexToHsl, hslToHex } from './color-utils';
import type { FluxTheme } from '@/content/constants';
import type { CustomTheme } from '@/presentation/features/settings/store/useSettingsStore';

// ─── HSL helpers ────────────────────────────────────────────────────────────

export function parseHsl(hsl: string): [number, number, number] {
    const parts = hsl.replace(/%/g, '').trim().split(/\s+/);
    return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])];
}

function formatHsl(h: number, s: number, l: number): string {
    return `${Math.round(h)} ${s.toFixed(1)}% ${l.toFixed(1)}%`;
}

/** Clamp a number between min and max */
function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

/** Return a lightness-shifted variant of an HSL string */
function shiftL(hsl: string, delta: number): string {
    const [h, s, l] = parseHsl(hsl);
    return formatHsl(h, s, clamp(l + delta, 2, 97));
}

/** Reduce saturation by a fraction */
function desaturate(hsl: string, fraction: number): string {
    const [h, s, l] = parseHsl(hsl);
    return formatHsl(h, clamp(s * (1 - fraction), 0, 100), l);
}

/**
 * Automatically pick a legible foreground (text) colour for a given background.
 * Returns a dark or light HSL string based on contrast.
 */
export function autoFg(bgHsl: string, darkFg: string, lightFg: string): string {
    const [, , l] = parseHsl(bgHsl);
    return l > 52 ? darkFg : lightFg;
}

// ─── Seed colours the user actually picks ───────────────────────────────────

export interface SeedColors {
    /** Main page background */
    background: string;   // hex
    /** Primary accent / brand colour */
    primary: string;      // hex
    /** Card / panel surface */
    card: string;         // hex
    /** Border colour */
    border: string;       // hex
    /** Foreground / body text */
    foreground: string;   // hex
}

export interface DerivedTokens {
    background: string;
    foreground: string;
    card: string;
    'card-foreground': string;
    popover: string;
    'popover-foreground': string;
    primary: string;
    'primary-foreground': string;
    secondary: string;
    'secondary-foreground': string;
    muted: string;
    'muted-foreground': string;
    accent: string;
    'accent-foreground': string;
    destructive: string;
    'destructive-foreground': string;
    border: string;
    input: string;
    'input-background': string;
    'reader-textarea-bg': string;
    ring: string;
    success: string;
    'success-foreground': string;
    'link-color': string;
}

/**
 * From 5 intuitive seed colours, derive the full set of Shadcn/Tailwind
 * CSS custom-property tokens used across the app.
 */
export function deriveTokens(seeds: SeedColors): DerivedTokens {
    const bg = hexToHsl(seeds.background);
    const fg = hexToHsl(seeds.foreground);
    const pr = hexToHsl(seeds.primary);
    const cd = hexToHsl(seeds.card);
    const bd = hexToHsl(seeds.border);

    // Derive foreground-on-primary via contrast
    const prFg = autoFg(pr, '0 0% 8%', '0 0% 98%');

    // Card and popover foreground — track the provided foreground hue/sat, adjust L for card bg
    const cdFg = autoFg(cd, fg, '0 0% 98%');

    // Secondary — similar to card but slightly different lightness
    const secondary = shiftL(cd, 0);
    const secondaryFg = autoFg(secondary, fg, '0 0% 98%');

    // Muted — de-saturated card variant
    const muted = desaturate(shiftL(cd, -2), 0.15);
    // Increase contrast shift for muted foreground to prevent conflicts with colorful backgrounds
    const mutedFg = autoFg(muted, shiftL(fg, 40), shiftL(fg, -30));

    // Accent — slight tint of primary layered over background
    const [ph, ps] = parseHsl(pr);
    const [, , bl] = parseHsl(bg);
    // Keep accent close to bg lightness, but hint of primary hue
    const accentL = bl > 60 ? Math.max(bl - 10, 50) : Math.min(bl + 12, 50);
    const accent = formatHsl(ph, Math.min(ps * 0.35, 40), accentL);
    const accentFg = autoFg(accent, fg, '0 0% 98%');

    // Popover — slightly offset from card
    const popover = shiftL(cd, 2);
    const popoverFg = autoFg(popover, fg, '0 0% 98%');

    // Input border reuses border; input-background matches bg
    const inputBg = shiftL(bg, bl > 60 ? -3 : 3);

    // Reader textarea — very subtle tint
    const readerBg = shiftL(bg, bl > 60 ? -5 : 5);

    // Ring = primary colour
    const ring = pr;

    // Destructive — fixed red, adjusted for dark/light mode
    const destructive = bl > 60 ? '0 72% 51%' : '0 55% 58%';
    const destructiveFg = '0 0% 98%';

    return {
        background: bg,
        foreground: fg,
        card: cd,
        'card-foreground': cdFg,
        popover,
        'popover-foreground': popoverFg,
        primary: pr,
        'primary-foreground': prFg,
        secondary,
        'secondary-foreground': secondaryFg,
        muted,
        'muted-foreground': mutedFg,
        accent,
        'accent-foreground': accentFg,
        destructive,
        'destructive-foreground': destructiveFg,
        border: bd,
        input: bd,
        'input-background': inputBg,
        'reader-textarea-bg': readerBg,
        ring,
        success: bl > 60 ? '142 55% 32%' : '142 65% 52%',
        'success-foreground': '0 0% 100%',
        'link-color': bl > 60 ? pr : '142 65% 52%', // Default to primary for light, success/emerald for dark
    };
}

/**
 * Extract the 5 seed colours from a full token map (for editing existing themes).
 */
export function seedsFromTokens(tokens: DerivedTokens): SeedColors {
    return {
        background: hslToHex(tokens.background),
        foreground: hslToHex(tokens.foreground),
        primary: hslToHex(tokens.primary),
        card: hslToHex(tokens.card),
        border: hslToHex(tokens.border),
    };
}

// ─── Built-in presets (reuse existing CSS vars from global.css) ──────────────

export const THEME_PRESETS: { id: string; label: string; seeds: SeedColors }[] = [
    {
        id: 'light',
        label: '☀️ Light',
        seeds: { background: '#f6faff', foreground: '#2c3040', primary: '#0081a7', card: '#f8f9fa', border: '#dee2e6' },
    },
    {
        id: 'dark',
        label: '🌙 Dark',
        seeds: { background: '#171d2e', foreground: '#f5f8ff', primary: '#f5f8ff', card: '#1e2538', border: '#2a3040' },
    },
    {
        id: 'nordic',
        label: '❄️ Nordic',
        seeds: { background: '#1b1f2e', foreground: '#e8ecf5', primary: '#62c4e0', card: '#21263a', border: '#2e3450' },
    },
    {
        id: 'cream',
        label: '📜 Cream',
        seeds: { background: '#eae2b7', foreground: '#3a2a18', primary: '#fcbf49', card: '#dfd8b0', border: '#c8bf90' },
    },
    {
        id: 'rose-pine',
        label: '🌸 Rosé Pine',
        seeds: { background: '#191724', foreground: '#e0def4', primary: '#ebbcba', card: '#1f1d2e', border: '#2a283e' },
    },
    {
        id: 'evergreen',
        label: '🌲 Evergreen',
        seeds: { background: '#f0f5f0', foreground: '#243c30', primary: '#4a9970', card: '#e8f0e8', border: '#c0d4c0' },
    },
    {
        id: 'moonlight',
        label: '🔭 Moonlight',
        seeds: { background: '#161a2e', foreground: '#c8d0e0', primary: '#5ecfdc', card: '#1b2036', border: '#2a3256' },
    },
    {
        id: 'sunset',
        label: '🌅 Sunset',
        seeds: { background: '#eae2b7', foreground: '#003049', primary: '#f77f00', card: '#dfd8a8', border: '#c8bf90' },
    },
];

// ─── Custom Theme → FluxTheme bridge ─────────────────────────────────────────

/** Converts an HSL token string + alpha → CSS rgba() string */
function hslToRgba(hsl: string, alpha: number): string {
    const hex = hslToHex(hsl);
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Converts a stored CustomTheme (HSL CSS-variable tokens) into the FluxTheme
 * object used by the extension popup, subtitle overlays, and hover popups.
 * This is the bridge between the two theming worlds.
 */
export function customThemeToFluxTheme(theme: CustomTheme): FluxTheme {
    const tokens = theme.colors as DerivedTokens;
    const [, , bgL] = parseHsl(tokens.background);
    const isDark = bgL < 52;

    const borderAlpha = isDark ? 0.22 : 0.30;

    return {
        name: theme.name,
        id: theme.id,
        dot: hslToHex(tokens.background),
        bg: hslToRgba(tokens.popover, 0.85),
        bgSolid: hslToHex(tokens.background),
        surface: hslToHex(tokens.card),
        surfaceActive: hslToHex(tokens.secondary),
        text: hslToHex(tokens.foreground),
        textSecondary: hslToHex(tokens['muted-foreground']),
        textDim: hslToRgba(tokens['muted-foreground'], 0.50),
        accent: hslToHex(tokens.primary),
        accentGlow: hslToRgba(tokens.primary, 0.20),
        border: hslToRgba(tokens.border, borderAlpha),
        borderLight: hslToRgba(tokens.border, borderAlpha * 0.5),
        error: hslToHex(tokens.destructive),
        success: hslToHex(tokens.success ?? (isDark ? '142 65% 52%' : '142 55% 32%')),
        info: hslToHex(tokens.primary),
    };
}
