import ReactMarkdown from 'react-markdown';
import { Button } from "../../../../components/ui/button";
import { Loader2, Volume2, BookA, Square, AudioLines, RotateCw } from "lucide-react";
import { useAudioStore } from '../../store/useAudioStore';
import { ConjugationsDisplay } from '../ConjugationsDisplay';
import { AnalysisSection } from './AnalysisSection';
import { GrammarTable } from './GrammarTable';
import { shouldFetchConjugations, type RichDetailsTab } from '../../store/slices/richDetailsSlice';
import { motion } from "framer-motion";
import { LANGUAGE_CODE_MAP } from '../../../../../core/constants/languages';
import { AccordionsSection } from './AccordionsSection';
import { AlternativesList } from './AlternativesList';
import { RichDetailsSkeleton } from './RichDetailsSkeleton';
import { RichDetailsError } from './RichDetailsError';
import { DictionariesSection } from './DictionariesSection';

interface RichDetailsContentProps {
    tab: RichDetailsTab;
    onRegenerate: () => void;
    onFetchConjugations: () => void;
    onCancel: () => void;
    onGenerateMoreExamples: () => void;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export function RichDetailsContent({
    tab,
    onRegenerate,
    onFetchConjugations,
    onCancel,
    onGenerateMoreExamples
}: RichDetailsContentProps) {
    const activeSingleText = useAudioStore(state => state.activeSingleText);
    const { data, isLoading, isStreaming, error, sourceLang, conjugationsLoading, conjugationsError } = tab;

    if (isLoading) {
        return <RichDetailsSkeleton onCancel={onCancel} />;
    }

    if (error) {
        return <RichDetailsError error={error} onRegenerate={onRegenerate} />;
    }

    if (!data) return null;

    const isPlayingThis = activeSingleText === data.segment;
    const langCode = LANGUAGE_CODE_MAP[sourceLang] || 'en';

    return (
        <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="show">
            {/* Main Translation */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="text-lg font-semibold text-primary max-w-none">
                        {data.grammar?.infinitive && data.grammar.infinitive !== data.segment ? (
                            <>
                                <span>{data.segment}</span>
                                <span className="text-sm font-normal text-primary/70 ml-1">
                                    {' — '}<span className="italic">{data.grammar.infinitive}</span>
                                </span>
                            </>
                        ) : (
                            <span>{data.segment}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <Button
                            variant="ghost" size="icon"
                            className={`h-6 w-6 rounded-full transition-colors ${isPlayingThis ? 'text-primary bg-primary/10' : ''}`}
                            onClick={() => useAudioStore.getState().playSingle(data.segment)}
                            title="Play Audio"
                        >
                            {isPlayingThis ? <AudioLines className="h-4 w-4 animate-pulse" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground transition-colors"
                            onClick={onRegenerate}
                            title="Regenerate details"
                        >
                            <RotateCw className="h-3.5 w-3.5" />
                        </Button>

                        {isStreaming && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-destructive hover:text-destructive" onClick={onCancel} title="Stop generating">
                                <Square className="h-3.5 w-3.5 fill-current" />
                            </Button>
                        )}
                    </div>
                </div>
                <div className="text-2xl font-bold text-foreground max-w-none">
                    {data.translationConjugated && data.translationConjugated !== data.translation
                        ? (
                            <>
                                <span>{data.translationConjugated}</span>
                                <span className="text-base font-normal text-muted-foreground ml-1">
                                    {' — '}<span className="italic">{data.translation}</span>
                                </span>
                            </>
                        )
                        : <span>{data.translation}</span>
                    }
                </div>

                {/* Alternative Translations */}
                {data.alternatives && data.alternatives.length > 0 && (
                    <div className="mt-3.5 space-y-1.5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Alternative Translations
                        </p>
                        <AlternativesList alternatives={data.alternatives} />
                    </div>
                )}

                {/* Direct Pill Lookups Dictionaries Card */}
                <DictionariesSection word={data.segment} langCode={langCode} />
            </motion.div>

            <motion.div variants={itemVariants}>
                <AnalysisSection syntaxAnalysis={data.syntaxAnalysis} grammarRules={data.grammarRules} />
            </motion.div>

            <motion.div variants={itemVariants}>
                <GrammarTable grammar={data.grammar} />
            </motion.div>

            {/* Conjugations — on-demand */}
            <motion.div variants={itemVariants}>
                {(() => {
                    const hasConjugations = data.conjugations && Object.keys(data.conjugations).length > 0;
                    if (hasConjugations) return <ConjugationsDisplay conjugations={data.conjugations!} />;
                    if (!shouldFetchConjugations(data, sourceLang)) return null;
                    return (
                        <div className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-semibold flex items-center gap-2"><BookA className="h-4 w-4" /> Conjugations</h4>
                                <Button variant="secondary" size="sm" onClick={onFetchConjugations} disabled={conjugationsLoading}>
                                    {conjugationsLoading ? <><Loader2 className="h-3 w-3 animate-spin mr-2" />Generating…</> : conjugationsError ? 'Retry' : 'Show conjugations'}
                                </Button>
                            </div>
                            {conjugationsError && <p className="text-xs text-destructive">{conjugationsError}</p>}
                            {!conjugationsError && !conjugationsLoading && <p className="text-xs text-muted-foreground">Generate a full conjugation table for this verb.</p>}
                        </div>
                    );
                })()}
            </motion.div>



            {/* Explanation from grammar */}
            {data.grammar?.explanation && (
                <motion.div variants={itemVariants} className="bg-muted p-3 rounded-lg text-sm">
                    <p className="font-medium mb-1">Explanation</p>
                    <div className="text-muted-foreground prose dark:prose-invert prose-sm prose-p:text-current max-w-none bg-transparent">
                        <ReactMarkdown>{data.grammar.explanation}</ReactMarkdown>
                    </div>
                </motion.div>
            )}

            {/* Accordion Lists */}
            <motion.div variants={itemVariants}>
                <AccordionsSection
                    examples={data.examples || []}
                    onGenerateMoreExamples={onGenerateMoreExamples} isStreaming={!!isStreaming}
                />
            </motion.div>


        </motion.div>
    );
}
