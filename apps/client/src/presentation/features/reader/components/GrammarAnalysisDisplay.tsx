import { X, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import type { GrammarAnalysisResult } from '../hooks/useGrammarAnalysis';

interface GrammarAnalysisDisplayProps {
    result: GrammarAnalysisResult | null;
    isLoading: boolean;
    onClose: () => void;
    onRegenerate: () => void;
}

const COLOR_MAP: Record<string, string> = {
    "1": "text-red-500",
    "2": "text-green-500",
    "3": "text-blue-500",
    "4": "text-orange-500",
    "5": "text-pink-500",
    "default": "text-gray-700 dark:text-gray-300"
};

export function GrammarAnalysisDisplay({ result, isLoading, onClose, onRegenerate }: GrammarAnalysisDisplayProps) {
    if (!result && !isLoading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl glass border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <CardTitle className="text-xl font-serif">Grammar Analysis</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={onRegenerate} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="overflow-y-auto p-6 md:p-8 space-y-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground text-sm">Analyzing sentence structure...</p>
                        </div>
                    ) : result ? (
                        <>
                            {/* Header Section: Source & Translation */}
                            <div className="space-y-4 text-center">
                                <h2 className="text-2xl md:text-3xl font-medium leading-relaxed font-serif">
                                    {result.grammar.map((item, idx) => (
                                        <span key={idx} className={`${COLOR_MAP[item.colorGroup] || COLOR_MAP['default']} mx-[2px] inline-block`}>
                                            {item.word}
                                        </span>
                                    ))}
                                </h2>
                                <p className="text-xl md:text-2xl text-muted-foreground font-serif italic">
                                    {result.translation}
                                </p>
                            </div>

                            <div className="border-t my-6" />

                            {/* Detailed Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-base md:text-lg">
                                {result.grammar.map((item, idx) => (
                                    <div key={idx} className="flex flex-wrap items-baseline gap-2">
                                        <span className={`font-bold uppercase tracking-wide ${COLOR_MAP[item.colorGroup] || COLOR_MAP['default']}`}>
                                            {item.word}
                                        </span>
                                        <span className="text-muted-foreground">:</span>
                                        <span className="font-medium text-foreground/90">
                                            {item.partOfSpeech}
                                            {item.details && <span className="text-muted-foreground font-normal">, {item.details}</span>}
                                        </span>
                                        <span className="text-muted-foreground">–</span>
                                        <span className="italic">"{item.translation}"</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}
