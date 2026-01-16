import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReaderFont =
    | 'system'
    | 'merriweather'
    | 'literata'
    | 'lora'
    | 'crimson-pro'
    | 'eb-garamond'
    | 'inter'
    | 'roboto';

export type FontSize = 'small' | 'medium' | 'large' | 'xl';

interface SettingsState {
    font: ReaderFont;
    fontSize: FontSize;
    setFont: (font: ReaderFont) => void;
    setFontSize: (size: FontSize) => void;
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
            setFont: (font) => set({ font }),
            setFontSize: (fontSize) => set({ fontSize }),
        }),
        { name: 'flux-reader-settings' }
    )
);
