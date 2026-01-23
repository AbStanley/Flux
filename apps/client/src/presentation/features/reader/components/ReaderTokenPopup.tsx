import ReactMarkdown from 'react-markdown';
import { Search, Volume2, RefreshCcw, Save, Check, Loader2, ChevronRight } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface ReaderTokenPopupProps {
    translation: string;
    onPlay: () => void;
    onMoreInfo: () => void;
    onRegenerate: () => void;
    onSave: () => void;
    isSaved?: boolean;
    collapsedText?: string;
}

export function ReaderTokenPopup({
    translation,
    onPlay,
    onMoreInfo,
    onRegenerate,
    onSave,
    isSaved,
    collapsedText
}: ReaderTokenPopupProps) {
    const buttonClass = cn(
        "ml-1 p-1 rounded-full cursor-pointer shadow-sm border border-border/10",
        "dark:bg-white/20 dark:hover:bg-white/30 dark:text-white dark:border-white/10", // Keep the glass look for dark mode if desired, or just use semantic
        "transition-all duration-300 ease-in-out",
        "opacity-100 scale-100"
    );

    const handleInteraction = (e: React.MouseEvent | React.TouchEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    const isLoading = translation === "...";

    if (collapsedText) {
        return (
            <span className="flex items-center justify-center p-1 text-xs whitespace-nowrap"
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                {collapsedText}
                <ChevronRight size={12} className="ml-0.5 inline-block opacity-70" strokeWidth={4} />
            </span>
        );
    }

    return (
        <span
            className="flex items-center group flex-wrap"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            <span className="flex-1 min-w-0 flex items-center">
                {isLoading ? (
                    <span className="flex items-center gap-2 text-sm font-medium px-2">
                        <Loader2 className="animate-spin" size={12} />
                        <span>Translating...</span>
                    </span>
                ) : (
                    <ReactMarkdown>{translation}</ReactMarkdown>
                )}
            </span>

            <div className={`flex items-center flex-shrink-0 transition-all duration-300 ease-in-out ${isLoading ? 'opacity-100 w-auto' : 'opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto overflow-hidden'}`}>
                <button
                    className={buttonClass}
                    onClick={(e) => handleInteraction(e, onPlay)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    title="Listen"
                >
                    <Volume2 size={14} strokeWidth={3} />
                </button>

                {!isLoading && (
                    <button
                        className={buttonClass}
                        onClick={(e) => handleInteraction(e, onMoreInfo)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        title="More Info"
                    >
                        <Search size={14} strokeWidth={3} />
                    </button>
                )}

                <button
                    className={buttonClass}
                    onClick={(e) => handleInteraction(e, onRegenerate)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    title="Regenerate Translation"
                >
                    <RefreshCcw size={14} strokeWidth={3} className={isLoading ? "animate-spin" : ""} />
                </button>

                {!isLoading && (
                    <button
                        className={buttonClass}
                        onClick={(e) => handleInteraction(e, onSave)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        title="Save Word"
                        disabled={isSaved}
                    >
                        {isSaved ? <Check size={14} strokeWidth={3} className="text-green-400" /> : <Save size={14} strokeWidth={3} />}
                    </button>
                )}
            </div>
        </span>
    );
};
