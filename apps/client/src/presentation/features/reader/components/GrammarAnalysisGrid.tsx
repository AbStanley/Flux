import { Card, CardContent } from "@/presentation/components/ui/card";
import type { GrammarAnalysisResult } from "../hooks/useGrammarAnalysis";
import { COLOR_MAP } from "./GrammarConstants";

interface GrammarAnalysisGridProps {
    analysisResult: GrammarAnalysisResult | null;
    isLoading: boolean;
}

export function GrammarAnalysisGrid({ analysisResult, isLoading }: GrammarAnalysisGridProps) {
    if (isLoading || !analysisResult) return null;

    return (
        <Card className="border-none shadow-sm bg-secondary/20">
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {analysisResult.grammar.map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-1 p-3 rounded-lg hover:bg-background/80 transition-colors">
                            <div className="flex items-baseline justify-between border-b border-border/40 pb-1 mb-1">
                                <span className={`font-bold text-lg ${COLOR_MAP[item.colorGroup] || COLOR_MAP['default']}`}>
                                    {item.word}
                                </span>
                                <span className="text-xs font-medium uppercase text-muted-foreground tracking-wider opacity-70">
                                    {item.partOfSpeech}
                                </span>
                            </div>
                            <span className="text-sm font-medium">{item.translation}</span>
                            {item.details && <span className="text-xs text-muted-foreground italic">{item.details}</span>}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
