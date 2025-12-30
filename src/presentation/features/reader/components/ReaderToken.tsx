import React, { memo } from 'react';
import styles from '../ReaderView.module.css';

import { Search, Volume2, RefreshCcw } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { HoverPosition } from '../../../../core/types';


interface ReaderTokenProps {
    token: string;
    index: number;
    globalIndex: number; // Passed from parent to avoid recalculation
    groupTranslation: string | undefined;
    position: string | undefined;

    // Hover State (Passed from parent)
    isHovered: boolean;
    isHoveredWord: boolean;
    hoverPosition?: HoverPosition;
    hoverTranslation?: string;

    // Audio State (Passed from parent)
    isAudioHighlighted: boolean;

    // Event Handlers
    onClick: (index: number) => void;
    onHover: (index: number) => void;
    onClearHover: () => void;
    onMoreInfo: (index: number) => void;
    onPlay: (index: number) => void;
    onSeek: (index: number) => void;
    onRegenerate: (index: number) => void;
}

const ReaderTokenComponent: React.FC<ReaderTokenProps> = ({
    token,
    index,
    globalIndex,
    groupTranslation,
    position,
    isHovered,
    isHoveredWord,
    hoverPosition,
    hoverTranslation,
    isAudioHighlighted,
    onClick,
    onHover,
    onClearHover,
    onMoreInfo,
    onPlay,
    onSeek,
    onRegenerate
}) => {
    const isWhitespace = !token.trim();
    const isSelected = !!position; // If position is assigned, it's selected/grouped

    const handleMouseEnter = () => {
        if (!isWhitespace) {
            onHover(index);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        if (!isWhitespace) {
            e.preventDefault();
            onPlay(index);
        }
    };



    const renderPopup = (translation: string) => {
        const buttonClass = cn(
            "ml-1 p-1 rounded-full cursor-pointer shadow-sm border border-white/10",
            "bg-white/20 hover:bg-white/30 text-white",
            "transition-all duration-300 ease-in-out",
            // Mobile: always visible
            "opacity-100 scale-100",
            // Desktop: hidden by default, visible on group hover
            "min-[1200px]:opacity-0 min-[1200px]:scale-75 min-[1200px]:w-0 min-[1200px]:p-0 min-[1200px]:ml-0",
            "min-[1200px]:group-hover:opacity-100 min-[1200px]:group-hover:scale-100 min-[1200px]:group-hover:w-auto min-[1200px]:group-hover:p-1 min-[1200px]:group-hover:ml-1"
        );

        const handleInteraction = (e: React.MouseEvent | React.TouchEvent, action: () => void) => {
            e.stopPropagation();
            // Prevent the long-press hook from seeing this as a start of a press
            // This is key because the hook might be listening on the parent
            action();
        };

        return (
            <span
                className="flex items-center group"
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                {translation}
                <div className="flex items-center overflow-hidden transition-all duration-300 ease-in-out">
                    <button
                        className={buttonClass}
                        onClick={(e) => handleInteraction(e, () => onPlay(index))}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        title="Listen"
                    >
                        <Volume2 size={14} strokeWidth={3} />
                    </button>
                    <button
                        className={buttonClass}
                        onClick={(e) => handleInteraction(e, () => onMoreInfo(index))}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        title="More Info"
                    >
                        <Search size={14} strokeWidth={3} />
                    </button>
                    <button
                        className={buttonClass}
                        onClick={(e) => handleInteraction(e, () => onRegenerate(index))}
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

    return (
        <span
            id={`token-${globalIndex}`}
            className={`
                ${styles.token} 
                ${isSelected ? styles.selected : ''} 
                ${!isWhitespace ? styles.interactive : ''}
                ${position ? styles[position] : ''} 
                ${groupTranslation ? styles.visualStart : ''}
                ${isAudioHighlighted ? styles.audioHighlight : ''}
                ${isHovered ? cn(
                styles.hoveredSentence,
                hoverPosition && styles[hoverPosition] // This handles border radius/shape for sentence
            ) : ''} 
                ${(isHoveredWord && !isSelected) ? styles.hoveredWord : ''}
            `}
            onClick={() => {
                if (!isWhitespace) {
                    onClearHover();
                    onClick(index);
                }
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onClearHover}
            onDoubleClick={(e) => {
                // Double click gesture for audio seeking
                e.stopPropagation();
                if (!isWhitespace) {
                    onSeek(index);
                }
            }}
            onContextMenu={handleContextMenu}
            style={{ position: 'relative' }}
        >
            {groupTranslation && (
                <span className={styles.selectionPopupValid}>
                    {renderPopup(groupTranslation)}
                </span>
            )}

            {/* Render token with markdown support */}
            {(() => {
                // Simple parser for **bold** and *italic*

                const renderParts = (text: string, bold: boolean) => {
                    const italicRegex = /\*([^*]+)\*/g;
                    if (italicRegex.test(text)) {
                        const parts = text.split(italicRegex);
                        return parts.map((part, i) => {
                            if (i % 2 === 1) {
                                // Italic
                                return <em key={i} className={`italic ${bold ? 'font-bold' : ''} text-foreground`}>{part}</em>;
                            }
                            return bold ? <strong key={i} className="font-bold text-foreground">{part}</strong> : part;
                        });
                    }
                    return bold ? <strong className="font-bold text-foreground">{text}</strong> : text;
                };

                const boldRegex = /\*\*(.*?)\*\*/g;
                if (boldRegex.test(token)) {
                    const parts = token.split(boldRegex);
                    return (
                        <>
                            {parts.map((part, i) =>
                                // Odd indices are bold captures
                                <React.Fragment key={i}>
                                    {renderParts(part, i % 2 === 1)}
                                </React.Fragment>
                            )}
                        </>
                    );
                } else {
                    // unexpected, check for just italic
                    return renderParts(token, false);
                }
            })()}

            {/* Show hover popup:
                - If NOT selected: Standard position (above).
                - If SELECTED: Show below to avoid clash with group translation + user request.
                - EXCEPTION: If selected is SINGLE word, disable below popup (green popup handles it).
             */}
            {(isHoveredWord) && hoverTranslation && !(isSelected && position === 'single') && (
                <span className={isSelected ? styles.hoverPopupBelow : styles.hoverPopup}>
                    {renderPopup(hoverTranslation)}
                </span>
            )}
        </span>
    );
};

export const ReaderToken = memo(ReaderTokenComponent);
