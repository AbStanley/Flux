import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";

interface LanguageOption {
    label: string;
    value: string;
}

interface LanguageSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: LanguageOption[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function LanguageSelect({
    label,
    value,
    onChange,
    options,
    placeholder = "Select Language",
    className,
    disabled
}: LanguageSelectProps) {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <Label className="uppercase text-xs text-muted-foreground tracking-wider">{label}</Label>
            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
