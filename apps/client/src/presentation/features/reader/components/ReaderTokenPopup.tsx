import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Search, Volume2, RefreshCcw } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface ReaderTokenPopupProps {
    translation: string;
    onPlay: () => void;
    onMoreInfo: () => void;
    onRegenerate: () => void;
}

export const ReaderTokenPopup: React.FC<ReaderTokenPopupProps> = ({
    translation,
    onPlay,
    onMoreInfo,
    onRegenerate
}) => {
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

    return (
        <span
            className="flex items-center group flex-wrap"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            <span className="flex-1 min-w-0">
                <ReactMarkdown>{translation}</ReactMarkdown>
            </span>
            <div className="flex items-center flex-shrink-0 transition-all duration-300 ease-in-out">
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
                <button
                    className={buttonClass}
                    onClick={(e) => handleInteraction(e, onRegenerate)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    title="Regenerate Translation"
                >
                    <RefreshCcw size={14} strokeWidth={3} />
                </button>
            </div>
        </span>
    );
};
