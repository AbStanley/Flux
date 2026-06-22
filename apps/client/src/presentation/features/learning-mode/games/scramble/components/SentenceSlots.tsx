import { ScrambleWordSlot } from './ScrambleWordSlot';
import type { WordSlotData } from '../types';
import type { GameItem } from '@/core/services/game/interfaces';

interface SentenceSlotsProps {
    slots: WordSlotData[];
    isRevealed: boolean;
    isComplete: boolean;
    currentItem: GameItem;
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
    currentItem,
    onSlotClick
}) => {
    return (
        <div className="flex flex-wrap gap-1.5 md:gap-3 justify-center items-center p-3 md:p-6 bg-card/30 rounded-xl md:rounded-2xl border border-white/5 min-h-[80px] md:min-h-[100px]">
            {slots.map((slot) => (
                <ScrambleWordSlot
                    key={slot.index}
                    slot={slot}
                    isRevealed={isRevealed}
                    isComplete={isComplete}
                    currentItem={currentItem}
                    onSlotClick={onSlotClick}
                />
            ))}
        </div>
    );
};
