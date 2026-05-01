export interface LanguageDef {
    name: string;
    code: string;    // ISO 639-1 (2-letter)
    country: string; // ISO 3166-1 alpha-2 (for flags)
    speechCode?: string; // BCP-47 (for STT/TTS)
}

/**
 * Master list of all supported languages with their metadata.
 * This is the single source of truth for languages across the app.
 */
export const ALL_LANGUAGES: LanguageDef[] = [
    { name: 'Spanish', code: 'es', country: 'es', speechCode: 'es-ES' },
    { name: 'English', code: 'en', country: 'gb', speechCode: 'en-US' },
    { name: 'French', code: 'fr', country: 'fr', speechCode: 'fr-FR' },
    { name: 'German', code: 'de', country: 'de', speechCode: 'de-DE' },
    { name: 'Italian', code: 'it', country: 'it', speechCode: 'it-IT' },
    { name: 'Portuguese', code: 'pt', country: 'pt', speechCode: 'pt-BR' },
    { name: 'Russian', code: 'ru', country: 'ru', speechCode: 'ru-RU' },
    { name: 'Ukrainian', code: 'uk', country: 'ua', speechCode: 'uk-UA' },
    { name: 'Japanese', code: 'jp', country: 'jp', speechCode: 'ja-JP' },
    { name: 'Chinese', code: 'zh', country: 'cn', speechCode: 'zh-CN' },
    { name: 'Korean', code: 'ko', country: 'kr', speechCode: 'ko-KR' },
    { name: 'Arabic', code: 'ar', country: 'sa', speechCode: 'ar-SA' },
    { name: 'Dutch', code: 'nl', country: 'nl', speechCode: 'nl-NL' },
    { name: 'Swedish', code: 'sv', country: 'se', speechCode: 'sv-SE' },
    { name: 'Polish', code: 'pl', country: 'pl', speechCode: 'pl-PL' },
    { name: 'Turkish', code: 'tr', country: 'tr', speechCode: 'tr-TR' },
    { name: 'Greek', code: 'el', country: 'gr', speechCode: 'el-GR' },
    { name: 'Hebrew', code: 'he', country: 'il', speechCode: 'he-IL' },
    // Extended list
    { name: 'Bengali', code: 'bn', country: 'bd' },
    { name: 'Vietnamese', code: 'vi', country: 'vn' },
    { name: 'Thai', code: 'th', country: 'th' },
    { name: 'Indonesian', code: 'id', country: 'id' },
    { name: 'Malay', code: 'ms', country: 'my' },
    { name: 'Filipino', code: 'tl', country: 'ph' },
    { name: 'Persian', code: 'fa', country: 'ir' },
    { name: 'Urdu', code: 'ur', country: 'pk' },
    { name: 'Swahili', code: 'sw', country: 'ke' },
    { name: 'Tamil', code: 'ta', country: 'in' },
    { name: 'Malayalam', code: 'ml', country: 'in' },
    { name: 'Telugu', code: 'te', country: 'in' },
    { name: 'Marathi', code: 'mr', country: 'in' },
    { name: 'Gujarati', code: 'gu', country: 'in' },
    { name: 'Punjabi', code: 'pa', country: 'in' },
    { name: 'Romanian', code: 'ro', country: 'ro' },
    { name: 'Czech', code: 'cs', country: 'cz' },
    { name: 'Hungarian', code: 'hu', country: 'hu' },
    { name: 'Finnish', code: 'fi', country: 'fi' },
    { name: 'Danish', code: 'dk', country: 'dk' },
    { name: 'Norwegian', code: 'no', country: 'no' },
    { name: 'Slovak', code: 'sk', country: 'sk' },
    { name: 'Bulgarian', code: 'bg', country: 'bg' },
    { name: 'Serbian', code: 'sr', country: 'rs' },
    { name: 'Croatian', code: 'hr', country: 'hr' },
    { name: 'Lithuanian', code: 'lt', country: 'lt' },
    { name: 'Latvian', code: 'lv', country: 'lv' },
    { name: 'Estonian', code: 'et', country: 'ee' },
    { name: 'Slovenian', code: 'sl', country: 'si' },
    { name: 'Irish', code: 'ga', country: 'ie' },
    { name: 'Afrikaans', code: 'af', country: 'za' },
    { name: 'Albanian', code: 'sq', country: 'al' },
    { name: 'Amharic', code: 'am', country: 'et' },
    { name: 'Armenian', code: 'hy', country: 'am' },
    { name: 'Azerbaijani', code: 'az', country: 'az' },
    { name: 'Basque', code: 'eu', country: 'es' },
    { name: 'Belarusian', code: 'be', country: 'by' },
    { name: 'Bosnian', code: 'bs', country: 'ba' },
    { name: 'Catalan', code: 'ca', country: 'es' },
    { name: 'Galician', code: 'gl', country: 'es' },
    { name: 'Georgian', code: 'ka', country: 'ge' },
    { name: 'Icelandic', code: 'is', country: 'is' },
    { name: 'Khmer', code: 'km', country: 'kh' },
    { name: 'Latin', code: 'la', country: 'va' },
    { name: 'Macedonian', code: 'mk', country: 'mk' },
    { name: 'Mongolian', code: 'mn', country: 'mn' },
    { name: 'Myanmar', code: 'my', country: 'mm' },
    { name: 'Nepali', code: 'ne', country: 'np' },
];

/** Derived: List of primary language names for dropdowns */
export const LANGUAGES = ALL_LANGUAGES.slice(0, 18).map(l => l.name);

/** Derived: Options for source language selectors (with Auto) */
export const SOURCE_LANGUAGES = [
    { label: "Auto Detect", value: "Auto" },
    ...ALL_LANGUAGES.slice(0, 18).map(l => ({ label: l.name, value: l.name }))
];

/** Derived: Options for target language selectors */
export const TARGET_LANGUAGES = ALL_LANGUAGES.slice(0, 18).map(l => ({
    label: l.name,
    value: l.name
}));

/** Derived: Map of language name to 2-letter ISO code */
export const LANGUAGE_CODE_MAP: Record<string, string> = ALL_LANGUAGES.reduce((acc, l) => {
    acc[l.name] = l.code;
    return acc;
}, {} as Record<string, string>);

/** Derived: Map of language name to BCP-47 speech code */
export const SPEECH_CODE_MAP: Record<string, string> = ALL_LANGUAGES.reduce((acc, l) => {
    if (l.speechCode) acc[l.name] = l.speechCode;
    return acc;
}, {} as Record<string, string>);
