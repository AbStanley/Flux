import { cn } from "@/lib/utils";
import type { SlotData } from '../types';

interface WordSlotsProps {
    slots: SlotData[][];
    focusedWordIndex: number;
    isRevealed: boolean;
    isComplete: boolean;
    onSlotClick: (wordIdx: number, slotIdx: number) => void;
    onFocusWord: (wordIdx: number) => void;
}

export const WordSlots: React.FC<WordSlotsProps> = ({
    slots,
    focusedWordIndex,
    isRevealed,
    isComplete,
    onSlotClick,
    onFocusWord
}) => {
    return (
        <div className="flex flex-col gap-6 items-center w-full">
            {slots.map((row, wIdx) => (
                <div
                    key={wIdx}
                    className={cn(
                        "flex flex-wrap gap-2 justify-center p-4 rounded-xl transition-all duration-300",
                        focusedWordIndex === wIdx && !isRevealed ? "bg-accent/50 ring-2 ring-primary/20" : "opacity-90"
                    )}
                    onClick={() => !isRevealed && onFocusWord(wIdx)}
                >
                    {row.map((slot, sIdx) => {
                        return (
                            <div
                                key={sIdx}
                                onClick={(e) => { e.stopPropagation(); onSlotClick(wIdx, sIdx); }}
                                className={cn(
                                    "w-10 h-12 md:w-12 md:h-14 flex items-center justify-center text-2xl font-bold rounded-md border-b-4 transition-all duration-150 select-none cursor-pointer",

                                    // Static
                                    slot.isStatic ? "border-transparent text-muted-foreground w-auto px-1" : "bg-card border-slate-700 shadow-sm",

                                    // Normal Filled
                                    slot.isFilled && !slot.isStatic && slot.status === 'none' && "bg-secondary border-secondary-foreground/20",

                                    // Success
                                    (slot.status === 'correct' || isComplete) && "bg-chart-success border-chart-success/50 text-white",
                                    slot.status === 'wrong' && "bg-chart-alert border-chart-alert/50 text-white animate-shake",

                                    // Revealed (Answer shown)
                                    slot.status === 'revealed' && "bg-blue-500 border-blue-700 text-white",

                                    // Focus
                                    focusedWordIndex === wIdx && !slot.isStatic && !slot.isFilled && !isRevealed && "ring-offset-1 ring-offset-background ring-2 ring-primary/30"
                                )}
                            >
                                {slot.char}
                            </div>
                        )
                    })}
                </div>
            ))}
        </div>
    );
};
