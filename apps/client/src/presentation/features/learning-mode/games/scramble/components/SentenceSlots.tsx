import { cn } from "@/lib/utils";
import type { WordSlotData } from '../types';

interface SentenceSlotsProps {
    slots: WordSlotData[];
    isRevealed: boolean;
    isComplete: boolean;
    onSlotClick: (index: number) => void;
}

/**
 * Renders word slots for sentence reconstruction.
 * Clicking a filled slot returns the word to the pool.
 */
export const SentenceSlots: React.FC<SentenceSlotsProps> = ({
    slots,
    isRevealed,
    isComplete,
    onSlotClick
}) => {
    return (
        <div className="flex flex-wrap gap-1.5 md:gap-3 justify-center items-center p-3 md:p-6 bg-card/30 rounded-xl md:rounded-2xl border border-white/5 min-h-[80px] md:min-h-[100px]">
            {slots.map((slot) => (
                <div
                    key={slot.index}
                    onClick={() => onSlotClick(slot.index)}
                    className={cn(
                        "min-w-[60px] md:min-w-[80px] h-10 md:h-14 px-2 md:px-4 flex items-center justify-center text-sm md:text-lg font-bold rounded-lg md:rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer select-none",

                        // Empty slot
                        !slot.isFilled && "border-muted-foreground/30 bg-muted/20 text-muted-foreground",

                        // Filled - normal
                        slot.isFilled && slot.status === 'none' && "border-primary/50 bg-primary/10 text-foreground hover:scale-105",

                        // Correct
                        (slot.status === 'correct' || isComplete) && "border-green-500 bg-green-500/20 text-green-400",

                        // Wrong
                        slot.status === 'wrong' && "border-red-500 bg-red-500/20 text-red-400 animate-shake",

                        // Revealed
                        slot.status === 'revealed' && "border-blue-500 bg-blue-500/20 text-blue-400",

                        // Disabled interactions during reveal/complete
                        (isRevealed || isComplete) && "cursor-default"
                    )}
                >
                    {slot.isFilled ? slot.word : '_____'}
                </div>
            ))}
        </div>
    );
};
