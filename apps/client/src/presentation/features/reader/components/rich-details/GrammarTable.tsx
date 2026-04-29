import { Badge } from "../../../../components/ui/badge";
import type { RichTranslationResult } from '../../../../../core/interfaces/IAIService';

interface GrammarTableProps {
    grammar: RichTranslationResult['grammar'];
}

export function GrammarTable({ grammar }: GrammarTableProps) {
    if (!grammar) return null;

    return (
        <div>
            <h4 className="text-sm font-semibold mb-2">Grammar Details</h4>
            <div className="flex flex-wrap gap-2">
                {grammar.partOfSpeech && (
                    <Badge variant="default" className="text-xs font-medium">
                        {grammar.partOfSpeech}
                    </Badge>
                )}
                {grammar.infinitive && (
                    <Badge variant="secondary" className="text-xs font-medium">
                        Inf: {grammar.infinitive}
                    </Badge>
                )}
                {grammar.tense && (
                    <Badge variant="outline" className="text-xs font-medium">
                        {grammar.tense}
                    </Badge>
                )}
                {grammar.gender && (
                    <Badge variant="secondary" className="text-xs font-medium">
                        {grammar.gender}
                    </Badge>
                )}
                {grammar.number && (
                    <Badge variant="secondary" className="text-xs font-medium">
                        {grammar.number}
                    </Badge>
                )}
            </div>
        </div>
    );
};
