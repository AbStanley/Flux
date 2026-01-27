import { Button } from '@/presentation/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';
import { Eye, EyeOff, Eraser, BookA } from "lucide-react";
import { SelectionMode } from '../../../../../core/types';
import { Toggle } from '@/presentation/components/ui/toggle';



interface ReaderSettingsProps {
    selectionMode: SelectionMode;
    onSelectionModeChange: (mode: SelectionMode) => void;
    vertical?: boolean;
}

export function ReaderSettings({
    selectionMode,
    onSelectionModeChange,
    vertical = false
}: ReaderSettingsProps) {
    return (
        <div className={`flex items-center gap-2 ${vertical ? 'flex-col items-end' : ''}`}>
            {!vertical && <div className="text-xs font-medium text-muted-foreground mb-1.5 ml-1">Selection Mode</div>}
            <Select
                value={selectionMode}
                onValueChange={(val) => onSelectionModeChange(val as SelectionMode)}
            >
                <SelectTrigger className={`bg-secondary/50 border-border/50 h-8 text-xs ${vertical ? 'w-[140px]' : 'w-full'}`}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={SelectionMode.Word} className="text-xs">Word Selection</SelectItem>
                    <SelectItem value={SelectionMode.Sentence} className="text-xs">Sentence Selection</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}

interface TranslationSettingsProps {
    showTranslations: boolean;
    onToggleTranslations: () => void;
    onClearTranslations: () => void;
}

export function TranslationSettings({
    showTranslations,
    onToggleTranslations,
    onClearTranslations
}: TranslationSettingsProps) {
    return (
        <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleTranslations}
                title={showTranslations ? "Hide Translations" : "Show Translations"}
            >
                {showTranslations ?
                    <Eye className="h-4 w-4 text-muted-foreground" /> :
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                }
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClearTranslations}
                title="Clear All Translations"
            >
                <Eraser className="h-4 w-4 text-muted-foreground" />
            </Button>
        </div>
    );
};

interface GrammarModeToggleProps {
    isGrammarMode: boolean;
    onToggle: () => void;
}

export function GrammarModeToggle({ isGrammarMode, onToggle, forceCollapsed = false }: GrammarModeToggleProps & { forceCollapsed?: boolean }) {
    return (
        <Toggle
            pressed={isGrammarMode}
            onPressedChange={onToggle}
            variant="outline"
            aria-label="Toggle Grammar Mode"
            title="Grammar Mode: Analyze sentences one by one"
            className={`h-8 gap-2 px-2 md:px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground ${isGrammarMode ? 'border-primary' : 'border-dashed'}`}
            size={forceCollapsed ? "sm" : "default"}
        >
            <BookA className="h-4 w-4" />
            <span className={`text-xs font-medium hidden ${forceCollapsed ? '' : 'md:inline'}`}>Grammar Mode</span>
        </Toggle>
    );
}
