import React from 'react';
import { Button } from "../../../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Eye, EyeOff, Eraser } from "lucide-react";
import { SelectionMode } from '../../../../../core/types';



interface ReaderSettingsProps {
    selectionMode: SelectionMode;
    onSelectionModeChange: (mode: SelectionMode) => void;
    vertical?: boolean;
}

export const ReaderSettings: React.FC<ReaderSettingsProps> = ({
    selectionMode,
    onSelectionModeChange,
    vertical = false
}) => {
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
};

interface TranslationSettingsProps {
    showTranslations: boolean;
    onToggleTranslations: () => void;
    onClearTranslations: () => void;
}

export const TranslationSettings: React.FC<TranslationSettingsProps> = ({
    showTranslations,
    onToggleTranslations,
    onClearTranslations
}) => {
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
