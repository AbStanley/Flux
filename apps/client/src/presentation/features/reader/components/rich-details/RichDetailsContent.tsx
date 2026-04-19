import ReactMarkdown from 'react-markdown';
import { Button } from "../../../../components/ui/button";
import { Loader2, Volume2, BookA, Square } from "lucide-react";
import { useAudioStore } from '../../store/useAudioStore';
import { ConjugationsDisplay } from '../ConjugationsDisplay';
import { AnalysisSection } from './AnalysisSection';
import { GrammarTable } from './GrammarTable';
import { ExamplesList } from './ExamplesList';
import { AlternativesList } from './AlternativesList';
import { shouldFetchConjugations, type RichDetailsTab } from '../../store/slices/richDetailsSlice';

interface RichDetailsContentProps {
    tab: RichDetailsTab;
    onRegenerate: () => void;
    onFetchConjugations: () => void;
    onCancel: () => void;
}

export function RichDetailsContent({ tab, onRegenerate, onFetchConjugations, onCancel }: RichDetailsContentProps) {
    const { data, isLoading, isStreaming, error, sourceLang, conjugationsLoading, conjugationsError } = tab;
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-40 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analyzing...</p>
                <Button variant="outline" size="sm" onClick={onCancel} className="gap-2">
                    <Square className="h-3 w-3 fill-current" /> Stop
                </Button>
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
                    {isStreaming && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full text-destructive hover:text-destructive"
                            onClick={onCancel}
                            title="Stop generating"
                        >
                            <Square className="h-3.5 w-3.5 fill-current" />
                        </Button>
                    )}
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

            {/* Conjugations — on-demand. The button appears for verb-like
                lookups in supported source languages; clicking triggers
                the fetch and the table replaces the button once loaded. */}
            {(() => {
                const hasConjugations = data.conjugations && Object.keys(data.conjugations).length > 0;
                if (hasConjugations) {
                    return <ConjugationsDisplay conjugations={data.conjugations!} />;
                }
                if (!shouldFetchConjugations(data, sourceLang)) return null;
                return (
                    <div className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <BookA className="h-4 w-4" /> Conjugations
                            </h4>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onFetchConjugations}
                                disabled={conjugationsLoading}
                            >
                                {conjugationsLoading ? (
                                    <>
                                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                        Generating…
                                    </>
                                ) : conjugationsError ? 'Retry' : 'Show conjugations'}
                            </Button>
                        </div>
                        {conjugationsError && (
                            <p className="text-xs text-destructive">{conjugationsError}</p>
                        )}
                        {!conjugationsError && !conjugationsLoading && (
                            <p className="text-xs text-muted-foreground">
                                Generate a full conjugation table for this verb.
                            </p>
                        )}
                    </div>
                );
            })()}

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
