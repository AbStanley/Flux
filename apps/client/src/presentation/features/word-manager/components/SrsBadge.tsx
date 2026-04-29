import { Clock } from 'lucide-react';
import { type Word } from '../../../../infrastructure/api/words';

interface SrsBadgeProps {
    word: Word;
}

export function SrsBadge({ word }: SrsBadgeProps) {
    if (!word.srsNextReview) return null;

    const isDue = new Date(word.srsNextReview) <= new Date();
    const reps = word.srsRepetitions ?? 0;

    if (isDue) {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full w-fit border border-destructive/20">
                <Clock className="w-2.5 h-2.5" />
                Due
            </span>
        );
    }

    if (reps > 0) {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full w-fit">
                {reps}x reviewed
            </span>
        );
    }

    return null;
}
