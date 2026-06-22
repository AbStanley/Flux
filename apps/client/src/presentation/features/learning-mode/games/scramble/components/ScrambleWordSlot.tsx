import { useState, useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { useServices } from '@/presentation/contexts/ServiceContext';
import { useWordsStore } from '@/presentation/features/word-manager/store/useWordsStore';
import { ReaderTokenPopup } from '@/presentation/features/reader/components/ReaderTokenPopup';
import popupStyles from '@/presentation/features/reader/components/ReaderPopup.module.css';
import { useGameAudio } from '../../hooks/useGameAudio';
import type { WordSlotData } from '../types';
import type { GameItem } from '@/core/services/game/interfaces';

interface ScrambleWordSlotProps {
    slot: WordSlotData;
    isRevealed: boolean;
    isComplete: boolean;
    currentItem: GameItem;
    onSlotClick: (index: number) => void;
}

const stripPunctuation = (s: string): string =>
    s.replace(/^[\s.,;:!?¡¿"""''«»()[\]{}\-–—…]+|[\s.,;:!?¡¿"""''«»()[\]{}\-–—…]+$/g, '');

export function ScrambleWordSlot({
    slot,
    isRevealed,
    isComplete,
    currentItem,
    onSlotClick
}: ScrambleWordSlotProps) {
    const { aiService } = useServices();
    const { playAudio } = useGameAudio();
    const addWord = useWordsStore(state => state.addWord);

    const [isHovered, setIsHovered] = useState(false);
    const [translation, setTranslation] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [savedItemKeys, setSavedItemKeys] = useState<Set<string>>(new Set());

    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const word = slot.word;
    const cleanWord = stripPunctuation(word);

    // Reset local state when word changes
    useEffect(() => {
        setTranslation(null);
        setIsLoading(false);
        setIsSaved(false);
        setSavedItemKeys(new Set());
    }, [word]);

    // Cleanup timers and abort controllers
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        };
    }, []);

    const handleMouseEnter = () => {
        if (!isComplete && !isRevealed) return;
        if (!cleanWord) return;

        setIsHovered(true);

        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

        hoverTimeoutRef.current = setTimeout(async () => {
            if (translation) return;

            setIsLoading(true);
            if (abortControllerRef.current) abortControllerRef.current.abort();
            const controller = new AbortController();
            abortControllerRef.current = controller;

            try {
                const targetLang = currentItem.lang?.source || 'en';
                const sourceLang = currentItem.lang?.target || 'es';
                const context = currentItem.answer;

                const result = await aiService.translateText(
                    cleanWord,
                    targetLang,
                    context,
                    sourceLang,
                    controller.signal
                );

                let translatedText = '';
                if (typeof result === 'object' && result !== null && 'response' in result) {
                    translatedText = result.response;
                } else {
                    translatedText = result as string;
                }

                if (!controller.signal.aborted) {
                    setTranslation(translatedText);
                }
            } catch (err) {
                console.error("Scramble word translation failed:", err);
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }, 150);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
    };

    const handleSave = () => {
        if (!cleanWord || !translation) return;
        const targetLang = currentItem.lang?.source || 'en';
        const sourceLang = currentItem.lang?.target || 'es';

        addWord({
            text: cleanWord,
            definition: translation,
            context: currentItem.answer,
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
            type: cleanWord.includes(' ') && cleanWord.length > 20 ? 'phrase' : 'word'
        }).then(() => {
            setSavedItemKeys(prev => new Set(prev).add('single'));
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }).catch(err => console.error("Failed to save word:", err));
    };

    const handlePlay = () => {
        if (!cleanWord) return;
        playAudio(cleanWord, currentItem.lang?.target);
    };

    const handleRegenerate = async () => {
        if (!cleanWord) return;
        setIsLoading(true);
        setTranslation(null);

        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const targetLang = currentItem.lang?.source || 'en';
            const sourceLang = currentItem.lang?.target || 'es';
            const context = currentItem.answer;

            const result = await aiService.translateText(
                cleanWord,
                targetLang,
                context,
                sourceLang,
                controller.signal
            );

            let translatedText = '';
            if (typeof result === 'object' && result !== null && 'response' in result) {
                translatedText = result.response;
            } else {
                translatedText = result as string;
            }

            if (!controller.signal.aborted) {
                setTranslation(translatedText);
            }
        } catch (err) {
            console.error("Scramble word translation regeneration failed:", err);
        } finally {
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }
        }
    };

    const displayTranslation = translation || (isLoading ? "..." : "");

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                onClick={() => !(isRevealed || isComplete) && onSlotClick(slot.index)}
                className={cn(
                    "min-w-[60px] md:min-w-[80px] h-10 md:h-14 px-2 md:px-4 flex items-center justify-center text-sm md:text-lg font-bold rounded-lg md:rounded-xl border-2 border-dashed transition-all duration-200 select-none",
                    
                    // Empty slot
                    !slot.isFilled && "border-muted-foreground/30 bg-muted/20 text-muted-foreground cursor-pointer",

                    // Filled - normal
                    slot.isFilled && slot.status === 'none' && "border-primary/50 bg-primary/10 text-foreground hover:scale-105 cursor-pointer",

                    // Correct
                    (slot.status === 'correct' || isComplete) && "border-chart-success bg-chart-success/20 text-chart-success cursor-default",

                    // Wrong
                    slot.status === 'wrong' && "border-chart-alert bg-chart-alert/20 text-chart-alert animate-shake cursor-pointer",

                    // Revealed
                    slot.status === 'revealed' && "border-blue-500 bg-blue-500/20 text-blue-400 cursor-default"
                )}
            >
                {slot.isFilled ? slot.word : '_____'}
            </div>

            {/* Translation Tooltip */}
            {isHovered && (isComplete || isRevealed) && slot.isFilled && displayTranslation && (
                <span
                    data-popup="true"
                    data-popup-active="true"
                    className={popupStyles.hoverPopup}
                    style={{
                        zIndex: 50,
                        transform: 'translateX(-50%)',
                        left: '50%'
                    }}
                >
                    <ReaderTokenPopup
                        translation={displayTranslation}
                        onPlay={handlePlay}
                        onSave={handleSave}
                        onRegenerate={handleRegenerate}
                        onMoreInfo={() => {}} // Simple mode inside the game view
                        isSaved={isSaved}
                        savedKeys={savedItemKeys}
                    />
                </span>
            )}
        </div>
    );
}
