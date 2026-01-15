import { Button } from "@/presentation/components/ui/button";
import { Volume2 } from 'lucide-react';
import { useSentenceScrambleLogic } from './hooks/useSentenceScrambleLogic';
import { SentenceSlots } from './components/SentenceSlots';
import { WordPool } from './components/WordPool';

/**
 * Sentence Scramble Game
 * Reconstruct the target sentence by clicking words in the correct order.
 */
export function SentenceScrambleGame() {
    const {
        currentItem,
        slots,
        wordPool,
        isRevealed,
        isComplete,
        handleWordClick,
        handleSlotClick,
        handleGiveUp,
        handleNext,
        playAudio
    } = useSentenceScrambleLogic();

    if (!currentItem) return null;

    return (
        <div className="flex flex-col h-full w-full max-w-3xl mx-auto gap-6 animate-in fade-in duration-500">
            {/* Question Area */}
            <div className="flex flex-col items-center justify-center space-y-4 min-h-[100px]">
                <h2 className="text-2xl md:text-3xl font-black text-center text-primary drop-shadow-sm leading-relaxed">
                    {currentItem.question}
                </h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => playAudio(currentItem.question, currentItem.lang?.source, currentItem.audioUrl)}
                    className="rounded-full hover:bg-primary/10"
                >
                    <Volume2 className="w-5 h-5 mr-2" />
                    Replay
                </Button>
            </div>

            {/* Sentence Slots */}
            <SentenceSlots
                slots={slots}
                isRevealed={isRevealed}
                isComplete={isComplete}
                onSlotClick={handleSlotClick}
            />

            {/* Word Pool */}
            <WordPool
                wordPool={wordPool}
                isComplete={isComplete}
                isRevealed={isRevealed}
                onWordClick={handleWordClick}
                onGiveUp={handleGiveUp}
                onNext={handleNext}
            />
        </div>
    );
};
