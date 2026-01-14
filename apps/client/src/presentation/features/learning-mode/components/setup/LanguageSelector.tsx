import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Label } from "@/presentation/components/ui/label";

interface LanguageSelectorProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    exclude?: string; // Language to exclude (e.g., already selected source)
    options?: string[]; // If provided, only show these options
}

const COMMON_LANGUAGES = [
    { code: 'es', country: 'es', name: 'Spanish' },
    { code: 'en', country: 'gb', name: 'English' },
    { code: 'ru', country: 'ru', name: 'Russian' },
    { code: 'de', country: 'de', name: 'German' },
    { code: 'fr', country: 'fr', name: 'French' },
    { code: 'it', country: 'it', name: 'Italian' },
    { code: 'jp', country: 'jp', name: 'Japanese' },
    { code: 'zh', country: 'cn', name: 'Chinese' },
    { code: 'pt', country: 'pt', name: 'Portuguese' },
    { code: 'ar', country: 'sa', name: 'Arabic' },
    { code: 'bn', country: 'bd', name: 'Bengali' },
    { code: 'nl', country: 'nl', name: 'Dutch' },
    { code: 'sv', country: 'se', name: 'Swedish' },
    { code: 'pl', country: 'pl', name: 'Polish' },
    { code: 'tr', country: 'tr', name: 'Turkish' },
    { code: 'vi', country: 'vn', name: 'Vietnamese' },
    { code: 'th', country: 'th', name: 'Thai' },
    { code: 'uk', country: 'ua', name: 'Ukrainian' },
    { code: 'el', country: 'gr', name: 'Greek' },
    { code: 'he', country: 'il', name: 'Hebrew' },
    { code: 'id', country: 'id', name: 'Indonesian' },
    { code: 'ms', country: 'my', name: 'Malay' },
    { code: 'tl', country: 'ph', name: 'Filipino' },
    { code: 'fa', country: 'ir', name: 'Persian' },
    { code: 'ur', country: 'pk', name: 'Urdu' },
    { code: 'sw', country: 'ke', name: 'Swahili' },
    { code: 'ta', country: 'in', name: 'Tamil' },
    { code: 'ml', country: 'in', name: 'Malayalam' },
    { code: 'te', country: 'in', name: 'Telugu' },
    { code: 'mr', country: 'in', name: 'Marathi' },
    { code: 'gu', country: 'in', name: 'Gujarati' },
    { code: 'pa', country: 'in', name: 'Punjabi' },
    { code: 'ro', country: 'ro', name: 'Romanian' },
    { code: 'cs', country: 'cz', name: 'Czech' },
    { code: 'hu', country: 'hu', name: 'Hungarian' },
    { code: 'fi', country: 'fi', name: 'Finnish' },
    { code: 'da', country: 'dk', name: 'Danish' },
    { code: 'no', country: 'no', name: 'Norwegian' },
    { code: 'sk', country: 'sk', name: 'Slovak' },
    { code: 'bg', country: 'bg', name: 'Bulgarian' },
    { code: 'sr', country: 'rs', name: 'Serbian' },
    { code: 'hr', country: 'hr', name: 'Croatian' },
    { code: 'lt', country: 'lt', name: 'Lithuanian' },
    { code: 'lv', country: 'lv', name: 'Latvian' },
    { code: 'et', country: 'ee', name: 'Estonian' },
    { code: 'sl', country: 'si', name: 'Slovenian' },
    { code: 'ga', country: 'ie', name: 'Irish' },
    { code: 'af', country: 'za', name: 'Afrikaans' },
    { code: 'sq', country: 'al', name: 'Albanian' },
    { code: 'am', country: 'et', name: 'Amharic' },
    { code: 'hy', country: 'am', name: 'Armenian' },
    { code: 'az', country: 'az', name: 'Azerbaijani' },
    { code: 'eu', country: 'es', name: 'Basque' },
    { code: 'be', country: 'by', name: 'Belarusian' },
    { code: 'bs', country: 'ba', name: 'Bosnian' },
    { code: 'ca', country: 'es', name: 'Catalan' },
    { code: 'gl', country: 'es', name: 'Galician' },
    { code: 'ka', country: 'ge', name: 'Georgian' },
    { code: 'is', country: 'is', name: 'Icelandic' },
    { code: 'km', country: 'kh', name: 'Khmer' },
    { code: 'la', country: 'va', name: 'Latin' },
    { code: 'mk', country: 'mk', name: 'Macedonian' },
    { code: 'mn', country: 'mn', name: 'Mongolian' },
    { code: 'my', country: 'mm', name: 'Myanmar' },
    { code: 'ne', country: 'np', name: 'Nepali' },
];

export const getFlagUrl = (countryCode: string) => {
    return `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
};

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    label,
    value,
    onChange,
    disabled,
    exclude,
    options
}) => {
    // If specific options provided (e.g. from DB graph), map them.
    // Otherwise fallback to common list.
    const displayOptions = options
        ? options.map(code => {
            const found = COMMON_LANGUAGES.find(cl => cl.code === code);
            return found || { code, country: '', name: code.toUpperCase() };
        })
        : COMMON_LANGUAGES;

    const selectedLang = value === 'all'
        ? { country: '', name: 'Any / Detect', code: 'all' }
        : COMMON_LANGUAGES.find(l => l.code === value) || displayOptions.find(l => l.code === value);

    const renderFlag = (item: { country?: string }) => {
        if (!item.country) return <span className="text-lg">🌍</span>;
        return <img
            src={getFlagUrl(item.country)}
            alt="flag"
            className="w-5 h-4 object-cover rounded-[1px]" // Slight rounding, fixed size
        />;
    };

    return (
        <div className="space-y-2">
            {label && <Label>{label}</Label>}
            <Select
                value={value}
                onValueChange={onChange}
                disabled={disabled}
            >
                <SelectTrigger>
                    {selectedLang ? (
                        <div className="flex items-center gap-2">
                            {renderFlag(selectedLang)}
                            <span className="uppercase">{selectedLang.name || selectedLang.code}</span>
                        </div>
                    ) : (
                        <SelectValue placeholder="Select Language" />
                    )}
                </SelectTrigger>
                <SelectContent>
                    {!options && <SelectItem value="all">
                        <span className="flex items-center gap-2">
                            <span className="text-lg">🌍</span>
                            <span className="uppercase">Any / Detect</span>
                        </span>
                    </SelectItem>}
                    {displayOptions.map(lang => (
                        <SelectItem
                            key={lang.code}
                            value={lang.code}
                            disabled={lang.code === exclude}
                        >
                            <span className="flex items-center gap-2">
                                {/* Safe check for country existing */}
                                {renderFlag(lang)}
                                <span className="uppercase">{lang.name || lang.code}</span>
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
