import React from 'react';
import styles from '../ReaderView.module.css';

import { Search, Volume2 } from 'lucide-react'; // Import icon
import { cn } from '../../../../lib/utils';


import { useReaderStore } from '../store/useReaderStore';
import { useTranslation } from '../hooks/useTranslation';
import { useAudioStore } from '../store/useAudioStore';
import { HoverPosition } from '../../../../core/types';

interface ReaderTokenProps {
    token: string;
    index: number;
    groupTranslation: string | undefined;
    position: string | undefined;
    isHovered?: boolean;
    hoverPosition?: HoverPosition;
    onClick: (index: number) => void;
    onMoreInfo: (index: number) => void;
    onPlay: (index: number) => void;
}

export const ReaderToken: React.FC<ReaderTokenProps> = ({
    token,
    index,
    groupTranslation,
    position,
    isHovered: propIsHovered,
    hoverPosition,
    onClick,
    onMoreInfo,
    onPlay
}) => {
    // Hooks
    const {
        handleHover,
        clearHover,
        hoveredIndex,
        hoverTranslation
    } = useTranslation();

    const { currentWordIndex, play } = useAudioStore();

    const currentPage = useReaderStore(s => s.currentPage);
    const PAGE_SIZE = useReaderStore(s => s.PAGE_SIZE);

    // Derived State
    const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
    const isWhitespace = !token.trim();
    const isSelected = !!position; // If position is assigned, it's selected/grouped

    // Use prop if provided, fallback to local check (for compatibility or simplified usage)
    const isHovered = propIsHovered !== undefined ? propIsHovered : hoveredIndex === index;

    const isAudioHighlighted = currentWordIndex === globalIndex;

    const handleMouseEnter = () => {
        if (!isWhitespace) {
            handleHover(index);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        if (!isWhitespace) {
            e.preventDefault();
            play(token);
        }
    };

    // Render helper for popup content
    const renderPopup = (translation: string) => {
        const buttonClass = cn(
            "ml-1 p-1 rounded-full cursor-pointer shadow-sm border border-white/10",
            "bg-white/20 hover:bg-white/30 text-white",
            "transition-all duration-300 ease-in-out",
            // Mobile: always visible
            "opacity-100 scale-100",
            // Desktop: hidden by default, visible on group hover
            "md:opacity-0 md:scale-75 md:w-0 md:p-0 md:ml-0",
            "md:group-hover:opacity-100 md:group-hover:scale-100 md:group-hover:w-auto md:group-hover:p-1 md:group-hover:ml-1"
        );

        return (
            <span className="flex items-center group">
                {translation}
                <div className="flex items-center overflow-hidden transition-all duration-300 ease-in-out">
                    <button
                        className={buttonClass}
                        onClick={(e) => {
                            e.stopPropagation();
                            onPlay(index);
                        }}
                        title="Listen"
                    >
                        <Volume2 size={14} strokeWidth={3} />
                    </button>
                    <button
                        className={buttonClass}
                        onClick={(e) => {
                            e.stopPropagation();
                            onMoreInfo(index);
                        }}
                        title="More Info"
                    >
                        <Search size={14} strokeWidth={3} />
                    </button>
                </div>
            </span>
        );
    };

    return (
        <span
            className={`
                ${styles.token} 
                ${isSelected ? styles.selected : ''} 
                ${!isWhitespace ? styles.interactive : ''}
                ${position ? styles[position] : ''}
                ${isAudioHighlighted ? styles.audioHighlight : ''}
                ${(isHovered && !isSelected) ? cn(styles.hovered, hoverPosition && styles[hoverPosition]) : ''} 
            `}
            onClick={() => {
                if (!isWhitespace) {
                    clearHover();
                    onClick(index);
                }
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={clearHover}
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
                // Check if token contains bold markdown **text**
                const boldRegex = /\*\*(.*?)\*\*/g;
                if (boldRegex.test(token)) {
                    const parts = token.split(boldRegex);
                    return (
                        <>
                            {parts.map((part, i) =>
                                // The split with capturing group returns: [pre, match, post, match, ...]
                                // If original was "A **bold** word", split is ["A ", "bold", " word"]
                                // Even indices are normal, odd are the captured group (bold)
                                // Wait, standard split does this. Let's verify.
                                // "A **B** C".split(/\*\*(.*?)\*\*/) -> ["A ", "B", " C"]
                                // So i % 2 === 1 is the bold part.
                                i % 2 === 1 ? <strong key={i} className="font-bold text-foreground">{part}</strong> : part
                            )}
                        </>
                    );
                }
                return token;
            })()}

            {(hoveredIndex === index) && hoverTranslation && !isSelected && (
                <span className={styles.hoverPopup}>
                    {renderPopup(hoverTranslation)}
                </span>
            )}
        </span>
    );
};
