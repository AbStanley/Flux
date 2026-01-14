import React from 'react';
import { Button } from "@/presentation/components/ui/button";
import { Volume2, RefreshCw } from 'lucide-react';
import { useAudioDictationLogic } from './hooks/useAudioDictationLogic';
import { WordSlots } from '../build-word/components/WordSlots';
import { LetterPool } from '../build-word/components/LetterPool';

export const AudioDictationGame: React.FC = () => {
    const {
        currentItem,
        slots,
        letterPool,
        focusedWordIndex,
        isRevealed,
        isComplete,
        audioMode,
        setFocusedWordIndex,
        handleInput,
        handleSlotClick,
        handleGiveUp,
        nextItem,
        playCurrentAudio,
        toggleAudioMode
    } = useAudioDictationLogic();

    if (!currentItem) return null;

    return (
        <div className="flex flex-col h-full w-full max-w-3xl mx-auto gap-6 animate-in fade-in duration-500">
            {/* Audio Control Area */}
            <div className="flex flex-col items-center justify-center space-y-6 min-h-[160px] p-6 bg-card/30 rounded-xl border-2 border-dashed">
                <div className="text-center space-y-2">
                    <h2 className="text-lg font-medium text-muted-foreground">
                        {audioMode === 'target'
                            ? "Listen and write what you hear"
                            : "Listen to the source and translate"}
                    </h2>

                    {/* Visual hints about language could go here */}
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        size="lg"
                        onClick={playCurrentAudio}
                        className="rounded-full h-16 w-16 shadow-lg hover:scale-105 transition-transform"
                    >
                        <Volume2 className="w-8 h-8" />
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAudioMode}
                    className="text-muted-foreground hover:text-primary"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Switch Mode: {audioMode === 'target' ? 'Dictation' : 'Translation'}
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
