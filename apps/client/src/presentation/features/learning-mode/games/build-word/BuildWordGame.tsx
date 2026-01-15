import { Button } from "@/presentation/components/ui/button";
import { Volume2 } from 'lucide-react';
import { useBuildWordLogic } from './hooks/useBuildWordLogic';
import { WordSlots } from './components/WordSlots';
import { LetterPool } from './components/LetterPool';

export function BuildWordGame() {
    const {
        currentItem,
        slots,
        letterPool,
        focusedWordIndex,
        isRevealed,
        isComplete,
        setFocusedWordIndex,
        handleInput,
        handleSlotClick,
        handleGiveUp,
        nextItem,
        playAudio
    } = useBuildWordLogic();

    if (!currentItem) return null;

    return (
        <div className="flex flex-col h-full w-full max-w-3xl mx-auto gap-6 animate-in fade-in duration-500">
            {/* Question Area */}
            <div className="flex flex-col items-center justify-center space-y-4 min-h-[120px]">
                <h2 className="text-3xl md:text-4xl font-black text-center text-primary drop-shadow-sm">
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

            <WordSlots
                slots={slots}
                focusedWordIndex={focusedWordIndex}
                isRevealed={isRevealed}
                isComplete={isComplete}
                onSlotClick={handleSlotClick}
                onFocusWord={setFocusedWordIndex}
            />

            <LetterPool
                letterPool={letterPool}
                isComplete={isComplete}
                isRevealed={isRevealed}
                onInput={handleInput}
                onGiveUp={handleGiveUp}
                onNext={nextItem}
            />
        </div>
    );
};
