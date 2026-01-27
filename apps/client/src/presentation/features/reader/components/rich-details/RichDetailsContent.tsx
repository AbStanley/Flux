import ReactMarkdown from 'react-markdown';
import { Button } from "../../../../components/ui/button";
import { Loader2, Volume2 } from "lucide-react";
import { useAudioStore } from '../../store/useAudioStore';
import type { RichTranslationResult } from '../../../../../core/interfaces/IAIService';
import { ConjugationsDisplay } from '../ConjugationsDisplay';
import { AnalysisSection } from './AnalysisSection';
import { GrammarTable } from './GrammarTable';
import { ExamplesList } from './ExamplesList';
import { AlternativesList } from './AlternativesList';

interface RichDetailsContentProps {
    data: RichTranslationResult | null;
    isLoading: boolean;
    error: string | null;
    onRegenerate: () => void;
}

export function RichDetailsContent({ data, isLoading, error, onRegenerate }: RichDetailsContentProps) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-40 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-40 space-y-4 text-center p-4">
                <p className="text-destructive font-medium">Error loading details</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={onRegenerate}>
                    Retry
                </Button>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            {/* Main Translation */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="text-lg font-semibold text-primary prose dark:prose-invert prose-p:my-0 prose-headings:my-0 prose-headings:text-lg prose-headings:font-semibold prose-headings:text-primary max-w-none">
                        <ReactMarkdown>{data.segment}</ReactMarkdown>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => useAudioStore.getState().playSingle(data.segment)}
                        title="Play Audio"
                    >
                        <Volume2 className="h-4 w-4" />
                    </Button>
                </div>
                <div className="text-2xl font-bold prose dark:prose-invert prose-p:my-0 prose-headings:my-1 max-w-none">
                    <ReactMarkdown>{data.translation}</ReactMarkdown>
                </div>
            </div>

            <AnalysisSection
                syntaxAnalysis={data.syntaxAnalysis}
                grammarRules={data.grammarRules}
            />

            <GrammarTable grammar={data.grammar} />

            {/* Conjugations (Verbs Only) */}
            {data.conjugations && Object.keys(data.conjugations).length > 0 && (
                <ConjugationsDisplay conjugations={data.conjugations} />
            )}

            {/* Explanation */}
            {data.grammar?.explanation && (
                <div className="bg-muted p-3 rounded-lg text-sm">
                    <p className="font-medium mb-1">Explanation</p>
                    <div className="text-muted-foreground prose dark:prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{data.grammar.explanation}</ReactMarkdown>
                    </div>
                </div>
            )}

            <ExamplesList examples={data.examples} />
            <AlternativesList alternatives={data.alternatives} />
        </div>
    );
};
