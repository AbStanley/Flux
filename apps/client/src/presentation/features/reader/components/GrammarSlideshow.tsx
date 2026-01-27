import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useSentenceNavigation } from '../hooks/useSentenceNavigation';
import { useGrammarAnalysis } from '../hooks/useGrammarAnalysis';
import { GrammarAnalysisGrid } from './GrammarAnalysisGrid';
import { COLOR_MAP } from './GrammarConstants';

interface GrammarSlideshowProps {
    tokens: string[];
    sourceLang: string;
    targetLang: string;
    onClose: () => void;
}



export function GrammarSlideshow({ tokens, sourceLang, targetLang, onClose }: GrammarSlideshowProps) {
    const {
        currentSentence,
        currentIndex,
        totalSentences,
        next,
        prev,
        hasNext,
        hasPrev,
        sentences
    } = useSentenceNavigation(tokens);

    const { analyze, prefetch, isLoading, error, analysisResult, clearResult } = useGrammarAnalysis();

    // Track last analyzed text to prevent duplicate requests
    const lastAnalyzedText = useRef<string | null>(null);

    // Analysis start effect
    useEffect(() => {
        if (currentSentence) {
            // Remove markdown headers (##), bold (**), etc for cleaner analysis
            const cleanText = currentSentence.text.replace(/[#*`]/g, '').trim();

            // Only analyze if text changed and not currently loading the same text
            if (cleanText !== lastAnalyzedText.current) {
                lastAnalyzedText.current = cleanText;
                analyze(cleanText, sourceLang, targetLang);
            }

            // Prefetch next sentence
            if (hasNext && currentIndex + 1 < sentences.length) {
                const nextSentence = sentences[currentIndex + 1];
                if (nextSentence) {
                    const cleanNextText = nextSentence.text.replace(/[#*`]/g, '').trim();
                    prefetch(cleanNextText, sourceLang, targetLang);
                }
            }
        } else {
            lastAnalyzedText.current = null;
            clearResult();
        }
    }, [currentSentence, sourceLang, targetLang, analyze, clearResult, hasNext, currentIndex, sentences, prefetch]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') next();
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [next, prev, onClose]);

    if (!currentSentence) {
        // Fallback for valid index but missing sentence data (shouldn't happen)
        if (totalSentences > 0 && currentIndex < totalSentences) {
            console.warn('GrammarSlideshow: Sentence data missing at index', currentIndex);
            return <div className="flex justify-center items-center h-full">Loading sentence {currentIndex + 1}...</div>;
        }
        return <div className="flex justify-center items-center h-full">No content available to analyze.</div>;
    }

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-300">
            {/* Header / Config Bar */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/20">
                <div className="text-sm font-medium text-muted-foreground">
                    Sentence {currentIndex + 1} of {totalSentences}
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onClose} size="sm">
                        <X className="mr-2 h-4 w-4" /> Exit Focus
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
                <div className="w-full max-w-4xl space-y-12">

                    {/* Sentence View */}
                    <div className="text-center space-y-6 min-h-[150px] flex flex-col justify-center">
                        {/* Source Sentence */}
                        <div className="text-2xl md:text-3xl lg:text-4xl font-serif font-medium leading-relaxed tracking-wide text-foreground">
                            {isLoading ? (
                                <span className="opacity-50">{currentSentence.text}</span>
                            ) : error ? (
                                <span className="text-destructive">{currentSentence.text}</span>
                            ) : analysisResult?.grammar ? (
                                analysisResult.grammar.map((item, idx) => (
                                    <span key={idx} className={`${COLOR_MAP[item.colorGroup] || COLOR_MAP['default']} inline-block mx-1 transition-colors duration-500`}>
                                        {item.word}
                                    </span>
                                ))
                            ) : (
                                <span>{currentSentence.text}</span>
                            )}
                        </div>

                        {/* Translation */}
                        <div className="text-xl md:text-2xl text-muted-foreground italic font-serif">
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm">Analyzing...</span>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center gap-3 text-sm text-destructive mt-2">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="font-semibold">Analysis Failed</span>
                                        <span>{error}</span>
                                        <span className="text-xs text-muted-foreground">Ensure Ollama is running and a model is available.</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const cleanText = currentSentence.text.replace(/[#*`]/g, '').trim();
                                            analyze(cleanText, sourceLang, targetLang);
                                        }}
                                        className="gap-2 border-destructive/50 hover:bg-destructive/10 text-destructive hover:text-destructive"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Retry Analysis
                                    </Button>
                                </div>
                            ) : analysisResult?.translation || "..."}
                        </div>
                    </div>


                    {/* Grammar Details Grid */}
                    {/* Grammar Details Grid */}
                    <GrammarAnalysisGrid analysisResult={analysisResult} isLoading={isLoading} />
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 px-4 pb-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Nouns</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Verbs</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Adjectives</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Adverbs/Preps</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Articles</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> Conjunctions</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500"></span> Pronouns</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500"></span> Other</div>
            </div>

            {/* Footer Navigation */}
            <div className="p-6 border-t bg-muted/20 flex justify-center items-center gap-8">
                <Button
                    variant="outline"
                    size="lg"
                    onClick={prev}
                    disabled={!hasPrev}
                    className="w-32 rounded-full h-12"
                >
                    <ChevronLeft className="mr-2 h-5 w-5" /> Prev
                </Button>

                <span className="text-muted-foreground font-medium text-sm">
                    {Math.round(((currentIndex + 1) / totalSentences) * 100)}%
                </span>

                <Button
                    variant="default"
                    size="lg"
                    onClick={next}
                    disabled={!hasNext}
                    className="w-32 rounded-full h-12 shadow-lg hover:shadow-xl transition-all"
                >
                    Next <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
            </div>
        </div >
    );
}
