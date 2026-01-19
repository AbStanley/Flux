import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Label } from "@/presentation/components/ui/label";
import { COMMON_LANGUAGES, getFlagUrl } from "./LanguageSelector.constants";

interface LanguageSelectorProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    exclude?: string; // Language to exclude (e.g., already selected source)
    options?: string[]; // If provided, only show these options
}

export function LanguageSelector({
    label,
    value,
    onChange,
    disabled,
    exclude,
    options
}: LanguageSelectorProps) {
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
                    {options && options.length === 0 && (
                        <SelectItem value="none" disabled>
                            <span className="text-muted-foreground italic">No languages found</span>
                        </SelectItem>
                    )}
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
