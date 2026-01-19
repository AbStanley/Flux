import { Button } from "@/presentation/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Flag } from 'lucide-react';
import type { WordBrickData } from '../types';

interface WordPoolProps {
    wordPool: WordBrickData[];
    isComplete: boolean;
    isRevealed: boolean;
    onWordClick: (brickId: string) => void;
    onGiveUp: () => void;
    onNext: () => void;
}

/**
 * Renders the pool of scrambled words to select from.
 * After reveal, shows Next button instead.
 */
export const WordPool: React.FC<WordPoolProps> = ({
    wordPool,
    isComplete,
    isRevealed,
    onWordClick,
    onGiveUp,
    onNext
}) => {
    return (
        <div className="w-full mt-auto p-2 md:p-4 bg-card/30 rounded-xl md:rounded-2xl border border-white/5 min-h-[100px] md:min-h-[140px] flex flex-col justify-center">
            {isRevealed ? (
                <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4">
                    <div className="text-lg md:text-xl font-bold text-blue-400">Answer Revealed</div>
                    <Button size="lg" className="w-full md:w-auto px-8" onClick={onNext}>
                        Next Sentence <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </div>
            ) : isComplete ? (
                <div className="flex flex-col items-center gap-4 animate-in zoom-in-95">
                    <div className="text-lg md:text-xl font-bold text-green-400">Correct! 🎉</div>
                </div>
            ) : (
                <>
                    {/* Word Bricks */}
                    <div className="flex flex-wrap gap-1.5 md:gap-3 justify-center mb-2 md:mb-4">
                        {wordPool.map((brick) => (
                            <Button
                                key={brick.id}
                                variant={brick.isUsed ? "ghost" : "outline"}
                                className={cn(
                                    "h-9 md:h-12 px-3 md:px-5 text-sm md:text-lg font-bold transition-all",
                                    brick.isUsed
                                        ? "opacity-20 scale-90"
                                        : "hover:scale-110 hover:-translate-y-1 bg-background shadow-md"
                                )}
                                disabled={brick.isUsed}
                                onClick={() => onWordClick(brick.id)}
                            >
                                {brick.word}
                            </Button>
                        ))}
                    </div>

                    {/* Give Up Button */}
                    <div className="flex justify-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={onGiveUp}
                        >
                            <Flag className="w-4 h-4 mr-2" /> Give Up
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};
