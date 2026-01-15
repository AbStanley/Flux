import ReactMarkdown from 'react-markdown';
import { Search, Volume2, RefreshCcw, Save, Check, Loader2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface ReaderTokenPopupProps {
    translation: string;
    onPlay: () => void;
    onMoreInfo: () => void;
    onRegenerate: () => void;
    onSave: () => void;
    isSaved?: boolean;
}

export function ReaderTokenPopup({
    translation,
    onPlay,
    onMoreInfo,
    onRegenerate,
    onSave,
    isSaved
}: ReaderTokenPopupProps) {
    const buttonClass = cn(
        "ml-1 p-1 rounded-full cursor-pointer shadow-sm border border-white/10",
        "bg-white/20 hover:bg-white/30 text-white",
        "transition-all duration-300 ease-in-out",
        "opacity-100 scale-100"
    );

    const handleInteraction = (e: React.MouseEvent | React.TouchEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    const isLoading = translation === "...";

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
                    <span className="flex items-center gap-2 text-xs text-muted-foreground italic px-2">
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
