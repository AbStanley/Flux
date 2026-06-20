import { memo, useRef, useState } from 'react';
import tokenStyles from './ReaderToken.module.css';
import popupStyles from './ReaderPopup.module.css';
import { cn } from '../../../../lib/utils';
import { HoverPosition } from '../../../../core/types';
import { ReaderTokenPopup } from './ReaderTokenPopup';
import { TokenText } from './TokenText';

import { useWordsStore } from '../../word-manager/store/useWordsStore';
import { useReaderStore } from '../store/useReaderStore';
import type { TranslationItem } from './ReaderTokenPopup';
import { cleanTranslationObj, getCollapsedText } from '../utils/tokenUtils';

interface ReaderTokenProps {
    token: string;
    index: number;
    globalIndex: number;
    groupTranslation: string | undefined;
    position: string | undefined;
    isHovered: boolean;
    isHoveredWord: boolean;
    hoverPosition?: HoverPosition;
    hoverTranslation?: string;
    isAudioHighlighted: boolean;
    isTitle?: boolean;
    onClick: (index: number, e: React.MouseEvent) => void;
    onHover: (index: number, source?: 'token' | 'popup') => void;
    onClearHover: () => void;
    onMoreInfo: (globalIndex: number, forceSingle?: boolean) => void;
    onPlay: (globalIndex: number, forceSingle?: boolean) => void;
    onSeek: (index: number) => void;
    onRegenerate: (globalIndex: number, forceSingle?: boolean) => void;
    groupText?: string;
    popupGroupItems?: TranslationItem[];
    isPopupSuppressed?: boolean;
}

const ReaderTokenComponent = ({
    token, index, globalIndex, groupTranslation, position, isHovered, isHoveredWord,
    hoverPosition, hoverTranslation, isAudioHighlighted, isTitle, onClick, onHover,
    onClearHover, onMoreInfo, onPlay, onSeek, onRegenerate, 
    groupText, popupGroupItems, isPopupSuppressed
}: ReaderTokenProps) => {
    const sanitizedGroupTranslation = cleanTranslationObj(groupTranslation);
    const sanitizedHoverTranslation = cleanTranslationObj(hoverTranslation);
    const isHeaderMarker = /^#+$/.test(token.trim());
    const isWhitespace = !token.trim();
    const isSelected = !!position;

    const tokenRef = useRef<HTMLSpanElement>(null);
    const popupContainerRef = useRef<HTMLSpanElement>(null);



    const addWord = useWordsStore(state => state.addWord);
    const [isSaved, setIsSaved] = useState(false);
    const [savedItemKeys, setSavedItemKeys] = useState<Set<string>>(new Set());
    const sourceLang = useReaderStore(state => state.sourceLang);
    const targetLang = useReaderStore(state => state.targetLang);

    const [isPopupHovered, setIsPopupHovered] = useState(false);

    const handleSaveItem = (itemIndex?: number, translationText?: string, sourceText?: string) => {
        const textToSave = sourceText || token;
        const transToSave = translationText || sanitizedGroupTranslation || '';
        if (!textToSave.trim()) return;

        addWord({
            text: textToSave, definition: transToSave, context: "",
            sourceLanguage: sourceLang, targetLanguage: targetLang,
            type: textToSave.includes(' ') && textToSave.length > 20 ? 'phrase' : 'word'
        }).then(() => {
            const key = itemIndex !== undefined ? `${itemIndex}-${itemIndex}` : 'single';
            setSavedItemKeys(prev => new Set(prev).add(key));
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }).catch(err => console.error(err));
    };

    const activeGroupItems = popupGroupItems || (sanitizedGroupTranslation ? [{
        key: groupText ? `${globalIndex}-${globalIndex + groupText.split('').length}` : `${globalIndex}-${globalIndex}`,
        text: groupText || token,
        translation: sanitizedGroupTranslation,
        globalIndex: globalIndex,
        isSaved: isSaved
    }] : undefined);

    if (isHeaderMarker) return null;
    if (isWhitespace && token.includes('\n')) return <br />;

    return (
        <span
            ref={tokenRef}
            id={`token-${globalIndex}`}
            className={`${tokenStyles.token} ${isSelected ? tokenStyles.selected : ''} 
                ${!isWhitespace ? tokenStyles.interactive : ''} ${position ? tokenStyles[position] : ''} 
                ${sanitizedGroupTranslation ? tokenStyles.visualStart : ''}
                ${isAudioHighlighted ? tokenStyles.audioHighlight : ''}
                ${isHovered ? cn(tokenStyles.hoveredSentence, hoverPosition && tokenStyles[hoverPosition]) : ''} 
                ${(isHoveredWord && !isSelected) ? tokenStyles.hoveredWord : ''}
                ${(isHoveredWord && isSelected) ? tokenStyles.hoveredSelected : ''} 
                ${(isHoveredWord || isPopupHovered) ? tokenStyles.zIndexTop : ''}
                ${isTitle ? 'text-xl font-bold text-foreground inline-block my-2' : ''}`}
            onClick={(e) => { if (!isWhitespace) { onClearHover(); onClick(index, e); } }}
            onMouseOver={() => { if (!isWhitespace) onHover(index, 'token'); }}
            onMouseLeave={onClearHover}
            onDoubleClick={(e) => { e.stopPropagation(); if (!isWhitespace) onSeek(index); }}
            onContextMenu={(e) => { if (!isWhitespace) { e.preventDefault(); onPlay(index, true); } }}
            style={{ position: 'relative' }}
            tabIndex={0}
        >
            {!isPopupSuppressed && activeGroupItems && activeGroupItems.length > 0 && (
                <span
                    ref={popupContainerRef}
                    data-popup="true"
                    data-popup-active={isHoveredWord || isPopupHovered ? "true" : "false"}
                    data-index={globalIndex}
                    className={popupStyles.selectionPopupValid}
                    style={{ 
                        maxWidth: 'min(600px, 85vw)', 
                    }}
                    onMouseOver={(e) => { e.stopPropagation(); onHover(index, 'popup'); }}
                    onMouseEnter={() => setIsPopupHovered(true)}
                    onMouseLeave={() => setIsPopupHovered(false)}
                >
                    <ReaderTokenPopup
                        items={activeGroupItems}
                        onPlay={(idx) => onPlay(idx !== undefined ? idx : globalIndex, false)}
                        onMoreInfo={(idx) => onMoreInfo(idx !== undefined ? idx : globalIndex, false)}
                        onRegenerate={(idx) => onRegenerate(idx !== undefined ? idx : globalIndex, false)}
                        onSave={handleSaveItem}
                        isSaved={isSaved}
                        savedKeys={savedItemKeys}
                        collapsedText={activeGroupItems.length === 1 ? getCollapsedText(activeGroupItems[0].text, activeGroupItems[0].translation, isPopupHovered) : undefined}
                    />
                </span>
            )}

            <span className="token-text">
                <TokenText token={token} />
            </span>

            {isHoveredWord && sanitizedHoverTranslation && !(isSelected && position === 'single') && (
                <span
                    ref={popupContainerRef}
                    data-popup="true"
                    data-popup-active="true"
                    data-index={globalIndex}
                    className={isSelected ? popupStyles.hoverPopupBelow : popupStyles.hoverPopup}
                    style={{ 
                        maxWidth: 'min(550px, 85vw)',
                    }}
                    onMouseOver={(e) => { e.stopPropagation(); onHover(index, 'token'); }}
                    onMouseEnter={() => setIsPopupHovered(true)}
                    onMouseLeave={() => setIsPopupHovered(false)}
                >
                    <ReaderTokenPopup
                        translation={sanitizedHoverTranslation}
                        onPlay={() => onPlay(globalIndex, true)}
                        onMoreInfo={() => onMoreInfo(globalIndex, true)}
                        onRegenerate={() => onRegenerate(globalIndex, true)}
                        onSave={() => handleSaveItem(undefined, sanitizedHoverTranslation, token)}
                        isSaved={isSaved}
                        collapsedText={getCollapsedText(token, sanitizedHoverTranslation, isPopupHovered)}
                    />
                </span>
            )}
        </span>
    );
};

export const ReaderToken = memo(ReaderTokenComponent);
