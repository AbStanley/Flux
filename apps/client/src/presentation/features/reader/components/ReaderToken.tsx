import { memo, useRef, useState } from 'react';
import tokenStyles from './ReaderToken.module.css';
import popupStyles from './ReaderPopup.module.css';
import { cn } from '../../../../lib/utils';
import { HoverPosition } from '../../../../core/types';
import { ReaderTokenPopup } from './ReaderTokenPopup';
import { TokenText } from './TokenText';
import { useTokenLayout } from '../hooks/useTokenLayout';
import { useWordsStore } from '../../word-manager/store/useWordsStore';
import { useReaderStore } from '../store/useReaderStore';


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

    // Styling
    isTitle?: boolean;

    // Event Handlers
    onClick: (index: number, e: React.MouseEvent) => void;
    onHover: (index: number, source?: 'token' | 'popup') => void;
    onClearHover: () => void;
    onMoreInfo: (index: number, forceSingle?: boolean) => void;
    onPlay: (index: number, forceSingle?: boolean) => void;
    onSeek: (index: number) => void;
    onRegenerate: (index: number, forceSingle?: boolean) => void;
    // New:
    containerRef?: React.RefObject<HTMLDivElement | null>;
    groupEndId?: string;
    groupText?: string;
}

const ReaderTokenComponent = ({
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
    isTitle,
    onClick,
    onHover,
    onClearHover,
    onMoreInfo,
    onPlay,
    onSeek,
    onRegenerate,
    containerRef,
    groupEndId,
    groupText,
}: ReaderTokenProps) => {
    // 1. Calculate derived state (synchronous)
    const isHeaderMarker = /^#+$/.test(token.trim());
    const isWhitespace = !token.trim();
    // Check if it contains newline
    const hasNewline = isWhitespace && token.includes('\n');
    const isSelected = !!position;

    const handleContextMenu = (e: React.MouseEvent) => {
        if (!isWhitespace) {
            e.preventDefault();
            // Right click triggers specific word audio
            onPlay(index, true);
        }
    };

    const tokenRef = useRef<HTMLSpanElement>(null);
    const popupContainerRef = useRef<HTMLSpanElement>(null);

    const { isRightAligned, dynamicMarginTop, dynamicMaxWidth } = useTokenLayout({
        tokenRef,
        containerRef,
        popupContainerRef,
        groupTranslation,
        hoverTranslation,
        isHovered,
        isSelected,
        groupEndId
    });

    const addWord = useWordsStore(state => state.addWord);
    // Local state for visual feedback
    const [isSaved, setIsSaved] = useState(false);

    const sourceLang = useReaderStore(state => state.sourceLang);
    const targetLang = useReaderStore(state => state.targetLang);

    const handleSave = (translationText: string) => {

        const textToSave = (groupText && translationText === groupTranslation)
            ? groupText
            : token;

        if (!textToSave.trim()) return;

        // Determine type: explicitly 'phrase' if it was a group translation, 
        // OR fallback heuristics (spaces) if generic.
        const type = (groupText && translationText === groupTranslation)
            ? 'phrase'
            : (textToSave.includes(' ') && textToSave.length > 20 ? 'phrase' : 'word');

        addWord({
            text: textToSave,
            definition: translationText,
            context: "",
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
            type: type
        }).then(() => {
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000); // Reset after 2s
        }).catch(err => console.error(err));
    };

    // Local state for popup hover interaction
    const [isPopupHovered, setIsPopupHovered] = useState(false);

    // Helper to calculate collapsed text
    const getCollapsedText = (source: string | undefined, translation: string | undefined, isHovered: boolean): string | undefined => {
        if (isHovered || !source || !translation) return undefined;
        // Truncation logic: If translation is longer than source, collapse it.
        // Limit visual width to roughly source text length.
        const sourceLen = source.trim().length;
        const transLen = translation.trim().length;

        if (transLen > sourceLen + 2) {
            if (sourceLen <= 4) return;
            return translation.slice(0, sourceLen - 1);
        }
        return undefined;
    };


    // 3. Conditional Returns (After hooks)
    if (isHeaderMarker) return null;
    if (hasNewline) return <br />;

    return (
        <span
            ref={tokenRef}
            id={`token-${globalIndex}`}
            className={`
                ${tokenStyles.token} 
                ${isSelected ? tokenStyles.selected : ''} 
                ${!isWhitespace ? tokenStyles.interactive : ''}
                ${position ? tokenStyles[position] : ''} 
                ${groupTranslation ? tokenStyles.visualStart : ''}
                ${isAudioHighlighted ? tokenStyles.audioHighlight : ''}
                ${isHovered ? cn(
                tokenStyles.hoveredSentence,
                hoverPosition && tokenStyles[hoverPosition] // This handles border radius/shape for sentence
            ) : ''} 
                ${(isHoveredWord && !isSelected) ? tokenStyles.hoveredWord : ''}
                ${(isHoveredWord && isSelected) ? tokenStyles.hoveredSelected : ''} 
                ${(isHoveredWord || isPopupHovered) ? tokenStyles.zIndexTop : ''}
                ${isTitle ? 'text-xl font-bold text-foreground inline-block my-2' : ''}
            `}
            onClick={(e) => {
                if (!isWhitespace) {
                    onClearHover();
                    onClick(index, e);
                }
            }}
            onMouseOver={() => {
                if (!isWhitespace) {
                    onHover(index, 'token');
                }
            }}
            onMouseLeave={onClearHover}
            onDoubleClick={(e) => {
                // Double click gesture for audio seeking
                e.stopPropagation();
                if (!isWhitespace) {
                    onSeek(index);
                }
            }}
            onContextMenu={handleContextMenu}
            style={{
                position: 'relative',
                marginTop: dynamicMarginTop ? `${dynamicMarginTop}px` : undefined,
                transition: 'margin-top 0.2s ease-out'
            }}
            tabIndex={0} // Allow focus to bring to front via CSS :focus-within
        >
            {groupTranslation && (
                <span
                    ref={popupContainerRef}
                    className={cn(popupStyles.selectionPopupValid, isRightAligned && popupStyles.popupRight)}
                    style={{
                        maxWidth: dynamicMaxWidth ? `${dynamicMaxWidth}px` : undefined,
                    }}
                    onMouseOver={(e) => {
                        e.stopPropagation();
                        onHover(index, 'popup');
                    }}
                    onMouseEnter={() => setIsPopupHovered(true)}
                    onMouseLeave={() => setIsPopupHovered(false)}
                >
                    {/* DEBUG RENDER */}
                    <ReaderTokenPopup
                        translation={groupTranslation}
                        onPlay={() => onPlay(index, false)}
                        onMoreInfo={() => onMoreInfo(index, false)}
                        onRegenerate={() => onRegenerate(index, false)}
                        onSave={() => handleSave(groupTranslation)}
                        isSaved={isSaved}
                        collapsedText={getCollapsedText(groupText || token, groupTranslation, isPopupHovered)}
                    />
                </span>
            )}

            {/* Render token with markdown support */}
            <TokenText token={token} />

            {/* Show hover popup:
                - If NOT selected: Standard position (above).
                - If SELECTED: Show below to avoid clash with group translation + user request.
                - EXCEPTION: If selected is SINGLE word, disable below popup (green popup handles it).
             */}
            {(isHoveredWord) && hoverTranslation && !(isSelected && position === 'single') && (
                <span
                    className={cn(isSelected ? popupStyles.hoverPopupBelow : popupStyles.hoverPopup, isRightAligned && popupStyles.popupRight)}
                    style={{ maxWidth: dynamicMaxWidth ? `${dynamicMaxWidth}px` : undefined }}
                    onMouseOver={(e) => {
                        e.stopPropagation();
                        onHover(index, 'token');
                    }}
                    onMouseEnter={() => setIsPopupHovered(true)}
                    onMouseLeave={() => setIsPopupHovered(false)}
                >
                    <ReaderTokenPopup
                        translation={hoverTranslation}
                        onPlay={() => onPlay(index, true)}
                        onMoreInfo={() => onMoreInfo(index, true)}
                        onRegenerate={() => onRegenerate(index, true)}
                        onSave={() => handleSave(hoverTranslation)}
                        isSaved={isSaved}
                        collapsedText={getCollapsedText(token, hoverTranslation, isPopupHovered)}
                    />
                </span>
            )}
        </span>
    );
};

export const ReaderToken = memo(ReaderTokenComponent);
