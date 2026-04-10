import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { WritingCorrection } from '@/types/writing';

interface Props {
    text: string;
    corrections: WritingCorrection[];
    highlightMode: string;
    hoveredId: number | null;
    onCorrectionClick: (mistakeText: string, index: number) => void;
    onCorrectionEnter: (id: number, rect: DOMRect) => void;
    onCorrectionLeave: () => void;
}

function getCorrectionStyling(type: string): string {
    const t = type.toLowerCase();
    if (t === 'spelling') return 'border-b-[2.5px] border-dotted border-pink-500 hover:bg-pink-500/10 dark:text-pink-100';
    if (t === 'punctuation') return 'border-b-[2.5px] border-dotted border-purple-500 hover:bg-purple-500/10 dark:text-purple-100';
    if (t === 'fluency' || t === 'style') return 'border-b-[2.5px] border-dotted border-orange-500 hover:bg-orange-500/10 dark:text-orange-100';
    return 'border-b-[2.5px] border-dotted border-emerald-500 hover:bg-emerald-500/10 dark:text-emerald-100';
}

export function HighlightedText({
    text, corrections, highlightMode, hoveredId,
    onCorrectionClick, onCorrectionEnter, onCorrectionLeave,
}: Props) {
    if (!text) return null;
    if (highlightMode !== 'full') return <>{text}</>;

    const sorted = [...corrections]
        .map((c, i) => ({ ...c, originalIndex: i }))
        .sort((a, b) => (a.offset || 0) - (b.offset || 0));

    const result: ReactNode[] = [];
    let lastIndex = 0;

    sorted.forEach((corr) => {
        if (corr.offset! < lastIndex) return;

        const actualText = text.slice(corr.offset!, corr.offset! + corr.length!);
        const matches = actualText.toLowerCase() === corr.correctionText.toLowerCase();

        if (corr.offset! > lastIndex) {
            result.push(text.slice(lastIndex, corr.offset!));
        }

        if (!matches) {
            result.push(actualText);
            lastIndex = corr.offset! + corr.length!;
            return;
        }

        const isHovered = hoveredId === corr.originalIndex;

        result.push(
            <span
                key={`corr-${corr.originalIndex}-${corr.offset}`}
                data-correction-id={corr.originalIndex}
                onClick={(e) => {
                    e.stopPropagation();
                    onCorrectionClick(corr.mistakeText, corr.originalIndex!);
                }}
                onMouseEnter={(e) => onCorrectionEnter(corr.originalIndex!, e.currentTarget.getBoundingClientRect())}
                onMouseLeave={onCorrectionLeave}
                className={cn(
                    'relative z-30 cursor-pointer rounded-sm transition-all pointer-events-auto',
                    getCorrectionStyling(corr.type),
                    isHovered && 'shadow-sm ring-2 ring-primary/25 dark:ring-emerald-400/30',
                )}
            >
                {actualText}
            </span>,
        );
        lastIndex = corr.offset! + corr.length!;
    });

    if (lastIndex < text.length) {
        result.push(text.slice(lastIndex));
    }

    return <>{result}</>;
}
