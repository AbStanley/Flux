import ReactMarkdown from 'react-markdown';
import { Button } from "../../../../components/ui/button";
import { Loader2, Volume2, BookA, Square, AudioLines } from "lucide-react";
import { useAudioStore } from '../../store/useAudioStore';
import { ConjugationsDisplay } from '../ConjugationsDisplay';
import { AnalysisSection } from './AnalysisSection';
import { GrammarTable } from './GrammarTable';
import { ExamplesList } from './ExamplesList';
import { AlternativesList } from './AlternativesList';
import { shouldFetchConjugations, type RichDetailsTab } from '../../store/slices/richDetailsSlice';
import { Skeleton } from "../../../../components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../../../components/ui/accordion";
import { motion } from "framer-motion";

interface RichDetailsContentProps {
    tab: RichDetailsTab;
    onRegenerate: () => void;
    onFetchConjugations: () => void;
    onCancel: () => void;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export function RichDetailsContent({ tab, onRegenerate, onFetchConjugations, onCancel }: RichDetailsContentProps) {
    const activeSingleText = useAudioStore(state => state.activeSingleText);
    const { data, isLoading, isStreaming, error, sourceLang, conjugationsLoading, conjugationsError } = tab;
    
    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-8 w-full" />
                </div>
                <div className="bg-muted/50 p-4 rounded-lg border space-y-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="rounded-md border p-4 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                </div>
                <div className="flex justify-center mt-4">
                    <Button variant="outline" size="sm" onClick={onCancel} className="gap-2">
                        <Square className="h-3 w-3 fill-current" /> Stop
                    </Button>
                </div>
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

    const isPlayingThis = activeSingleText === data.segment;

    return (
        <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {/* Main Translation */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center gap-2 mb-1">
                    <div className="text-lg font-semibold text-primary prose dark:prose-invert prose-p:my-0 prose-p:text-current prose-headings:my-0 prose-headings:text-lg prose-headings:font-semibold prose-headings:text-current max-w-none">
                        <ReactMarkdown>{data.segment}</ReactMarkdown>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 rounded-full transition-colors ${isPlayingThis ? 'text-primary bg-primary/10' : ''}`}
                        onClick={() => useAudioStore.getState().playSingle(data.segment)}
                        title="Play Audio"
                    >
                        {isPlayingThis ? <AudioLines className="h-4 w-4 animate-pulse" /> : <Volume2 className="h-4 w-4" />}
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
                <div className="text-2xl font-bold text-foreground prose dark:prose-invert prose-p:my-0 prose-p:text-current prose-headings:my-1 prose-headings:text-current max-w-none">
                    <ReactMarkdown>{data.translation}</ReactMarkdown>
                </div>
            </motion.div>

            <motion.div variants={itemVariants}>
                <AnalysisSection
                    syntaxAnalysis={data.syntaxAnalysis}
                    grammarRules={data.grammarRules}
                />
            </motion.div>

            <motion.div variants={itemVariants}>
                <GrammarTable grammar={data.grammar} />
            </motion.div>

            {/* Conjugations — on-demand */}
            <motion.div variants={itemVariants}>
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
            </motion.div>

            {/* Explanation */}
            {data.grammar?.explanation && (
                <motion.div variants={itemVariants} className="bg-muted p-3 rounded-lg text-sm">
                    <p className="font-medium mb-1">Explanation</p>
                    <div className="text-muted-foreground prose dark:prose-invert prose-sm prose-p:text-current max-w-none">
                        <ReactMarkdown>{data.grammar.explanation}</ReactMarkdown>
                    </div>
                </motion.div>
            )}

            <motion.div variants={itemVariants}>
                <Accordion type="multiple" defaultValue={["examples", "alternatives"]} className="w-full space-y-2">
                    {data.examples && data.examples.length > 0 && (
                        <AccordionItem value="examples" className="border rounded-lg px-3 py-1">
                            <AccordionTrigger className="py-2 hover:no-underline text-sm font-semibold">
                                Examples
                            </AccordionTrigger>
                            <AccordionContent className="pb-3 pt-1">
                                <ExamplesList examples={data.examples} />
                            </AccordionContent>
                        </AccordionItem>
                    )}
                    
                    {data.alternatives && data.alternatives.length > 0 && (
                        <AccordionItem value="alternatives" className="border rounded-lg px-3 py-1">
                            <AccordionTrigger className="py-2 hover:no-underline text-sm font-semibold">
                                Alternatives
                            </AccordionTrigger>
                            <AccordionContent className="pb-3 pt-1">
                                <AlternativesList alternatives={data.alternatives} />
                            </AccordionContent>
                        </AccordionItem>
                    )}
                </Accordion>
            </motion.div>
        </motion.div>
    );
};
