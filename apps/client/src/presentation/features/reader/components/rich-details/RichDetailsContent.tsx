import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "../../../../components/ui/button";
import { Loader2, Volume2, BookA, Square, AudioLines, Sparkles, RotateCw } from "lucide-react";
import { useAudioStore } from '../../store/useAudioStore';
import { ConjugationsDisplay } from '../ConjugationsDisplay';
import { AnalysisSection } from './AnalysisSection';
import { GrammarTable } from './GrammarTable';
import { shouldFetchConjugations, type RichDetailsTab } from '../../store/slices/richDetailsSlice';
import { Skeleton } from "../../../../components/ui/skeleton";
import { motion } from "framer-motion";
import { LANGUAGE_CODE_MAP } from '../../../../../core/constants/languages';
import { DictionaryModal, type TabType } from './DictionaryModal';
import { AccordionsSection } from './AccordionsSection';

interface RichDetailsContentProps {
    tab: RichDetailsTab;
    onRegenerate: () => void;
    onFetchConjugations: () => void;
    onCancel: () => void;
    onExplainWord: () => void;
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
    onExplainWord,
    onGenerateMoreExamples
}: RichDetailsContentProps) {
    const activeSingleText = useAudioStore(state => state.activeSingleText);
    const { data, isLoading, isStreaming, error, sourceLang, conjugationsLoading, conjugationsError, aiExplanation, aiExplanationLoading, aiExplanationError } = tab;
    const [isDictOpen, setIsDictOpen] = useState(false);
    const [dictTab, setDictTab] = useState<TabType>('oxford');

    const openDictionary = (tabName: TabType) => {
        setDictTab(tabName);
        setIsDictOpen(true);
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-8 w-full" /></div>
                <div className="bg-muted/50 p-4 rounded-lg border space-y-3">
                    <Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" />
                </div>
                <div className="rounded-md border p-4 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <div className="flex gap-2"><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-6 w-20 rounded-full" /></div>
                </div>
                <div className="flex justify-center mt-4">
                    <Button variant="outline" size="sm" onClick={onCancel} className="gap-2"><Square className="h-3 w-3 fill-current" /> Stop</Button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-40 space-y-4 text-center p-4">
                <p className="text-destructive font-medium">Error loading details</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={onRegenerate}>Retry</Button>
            </div>
        );
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

                {/* Direct Pill Lookups Dictionaries Card */}
                <div className="bg-muted/30 border border-border/60 rounded-xl p-3.5 mt-3 space-y-3 shadow-sm hover:shadow-md transition-all">
                    <div className="space-y-0.5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <BookA className="h-3.5 w-3.5 text-primary" /> Dictionaries
                        </p>
                        <p className="text-xs text-muted-foreground/80 leading-normal">Select an option to look up the word in-app:</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        <Button
                            variant="outline" size="sm" onClick={() => openDictionary('oxford')}
                            className="text-xs font-semibold border-border/80 hover:bg-muted bg-card text-foreground/80 hover:text-foreground rounded-full h-8 px-3.5 transition-all"
                        >
                            Google Define 🔍
                        </Button>
                        <Button
                            variant="outline" size="sm" onClick={() => openDictionary('wiktionary')}
                            className="text-xs font-semibold border-border/80 hover:bg-muted bg-card text-foreground/80 hover:text-foreground rounded-full h-8 px-3.5 transition-all"
                        >
                            Wiktionary 📖
                        </Button>
                        <Button
                            variant="outline" size="sm" onClick={() => openDictionary('freedict')}
                            className="text-xs font-semibold border-border/80 hover:bg-muted bg-card text-foreground/80 hover:text-foreground rounded-full h-8 px-3.5 transition-all"
                        >
                            Free Dictionary 🌐
                        </Button>
                    </div>
                </div>

                {/* Unified Widescreen Lookup Modal */}
                <DictionaryModal
                    isOpen={isDictOpen} onOpenChange={setIsDictOpen} word={data.segment}
                    langCode={langCode} activeTab={dictTab} onTabChange={setDictTab}
                    aiExplanation={aiExplanation} aiExplanationLoading={aiExplanationLoading}
                    aiExplanationError={aiExplanationError} onExplainWord={onExplainWord}
                />
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

            {/* AI Explanation — manually triggered in side-panel too */}
            <motion.div variants={itemVariants} className="border rounded-lg p-3 space-y-2 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-primary"><Sparkles className="h-4 w-4" /> AI Dictionary Explanation</h4>
                    {!aiExplanation && (
                        <Button variant="secondary" size="sm" onClick={onExplainWord} disabled={aiExplanationLoading}>
                            {aiExplanationLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Explaining…</> : aiExplanationError ? 'Retry' : 'Explain Word'}
                        </Button>
                    )}
                </div>
                {aiExplanationError && <p className="text-xs text-destructive">{aiExplanationError}</p>}
                {aiExplanationLoading && <div className="space-y-2 mt-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div>}
                {aiExplanation && (
                    <div className="text-xs text-foreground mt-2 leading-relaxed prose dark:prose-invert prose-sm max-w-none prose-p:my-1">
                        <ReactMarkdown>{aiExplanation}</ReactMarkdown>
                    </div>
                )}
                {!aiExplanation && !aiExplanationLoading && !aiExplanationError && (
                    <p className="text-xs text-muted-foreground">Get a detailed, non-translated explanation of the word's meaning.</p>
                )}
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
                    examples={data.examples || []} alternatives={data.alternatives || []}
                    onGenerateMoreExamples={onGenerateMoreExamples} isStreaming={!!isStreaming}
                />
            </motion.div>
        </motion.div>
    );
}
