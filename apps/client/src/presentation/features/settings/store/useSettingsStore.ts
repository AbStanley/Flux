import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ContentType, ProficiencyLevel } from '../../../../core/types/AIConfig';

export type ReaderFont =
    | 'system'

    | 'merriweather'
    | 'literata'
    | 'lora'
    | 'crimson-pro'
    | 'eb-garamond'
    | 'inter'
    | 'roboto'
    | 'dyslexic';

export type FontSize = 'small' | 'medium' | 'large' | 'xl';
export type SrsRevealAudioMode = 'none' | 'source' | 'target' | 'both';

export interface CustomTheme {
    id: string; // 'custom-<uuid>'
    name: string;
    emoji?: string;
    colors: {
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
        'link-foreground': string;
        'selection-foreground': string;
        'chart-trend': string;
        'chart-growth': string;
        'chart-alert': string;
        'chart-success': string;
        'chart-muted': string;
    };
}

export interface SettingsState {
    font: ReaderFont;
    fontSize: FontSize;
    customThemes: CustomTheme[];
    llmModel: string;
    contentType: ContentType;
    proficiencyLevel: ProficiencyLevel;
    speakOnHover: boolean;
    srsRevealAudioMode: SrsRevealAudioMode;
    aiHost: string;

    setFont: (font: ReaderFont) => void;
    setFontSize: (size: FontSize) => void;
    setLlmModel: (model: string) => void;
    setContentType: (type: ContentType) => void;
    setProficiencyLevel: (level: ProficiencyLevel) => void;
    setSpeakOnHover: (enabled: boolean) => void;
    setSrsRevealAudioMode: (mode: SrsRevealAudioMode) => void;
    setAiHost: (host: string) => void;

    addCustomTheme: (theme: CustomTheme) => void;
    removeCustomTheme: (id: string) => void;
    updateCustomTheme: (theme: CustomTheme) => void;
}

export const FONT_FAMILY_MAP: Record<ReaderFont, string> = {
    system: 'system-ui, -apple-system, sans-serif',
    merriweather: "'Merriweather', serif",
    literata: "'Literata Variable', serif",
    lora: "'Lora Variable', serif",
    'crimson-pro': "'Crimson Pro', serif",
    'eb-garamond': "'EB Garamond', serif",
    inter: "'Inter', sans-serif",
    roboto: "'Roboto Flex Variable', sans-serif",
    dyslexic: "'OpenDyslexic', sans-serif",
};

export const FONT_SIZE_MAP: Record<FontSize, string> = {
    small: '1rem',
    medium: '1.25rem',
    large: '1.5rem',
    xl: '1.75rem',
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            font: 'system',
            fontSize: 'medium',
            customThemes: [],
            llmModel: '',  // Default to empty to let backend pick available model
            contentType: 'Story',
            proficiencyLevel: 'B1',
            speakOnHover: false,
            srsRevealAudioMode: 'target',
            aiHost: '',

            setFont: (font) => set({ font }),
            setFontSize: (fontSize) => set({ fontSize }),
            setLlmModel: (llmModel) => set({ llmModel }),
            setContentType: (contentType) => set({ contentType }),
            setProficiencyLevel: (proficiencyLevel) => set({ proficiencyLevel }),
            setSpeakOnHover: (speakOnHover) => set({ speakOnHover }),
            setSrsRevealAudioMode: (srsRevealAudioMode) =>
                set({ srsRevealAudioMode }),
            setAiHost: (aiHost) => set({ aiHost }),

            addCustomTheme: (theme) => set((state) => ({ customThemes: [...state.customThemes, theme] })),
            removeCustomTheme: (id) => set((state) => ({ customThemes: state.customThemes.filter((t) => t.id !== id) })),
            updateCustomTheme: (theme) => set((state) => ({
                customThemes: state.customThemes.map((t) => (t.id === theme.id ? theme : t)),
            })),
        }),
        {
            name: 'flux-reader-settings',
        }
    )
);
