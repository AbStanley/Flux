import ReactMarkdown from 'react-markdown';
import { Search, Volume2, RefreshCcw, Save, Check, ChevronRight } from 'lucide-react';
import { cn } from '../../../../lib/utils';

export interface TranslationItem {
    key: string;
    text: string;
    translation: string;
    globalIndex: number;
    isSaved: boolean;
}

interface ReaderTokenPopupProps {
    items?: TranslationItem[];
    translation?: string;
    onPlay: (index?: number) => void;
    onMoreInfo: (index?: number) => void;
    onRegenerate: (index?: number) => void;
    onSave: (index?: number, translationText?: string, sourceText?: string) => void;
    isSaved?: boolean;
    savedKeys?: Set<string>;
    collapsedText?: string;
}

export function ReaderTokenPopup({
    items,
    translation,
    onPlay,
    onMoreInfo,
    onRegenerate,
    onSave,
    isSaved,
    savedKeys,
    collapsedText
}: ReaderTokenPopupProps) {
    const buttonClass = cn(
        "ml-1 p-1 rounded-full cursor-pointer shadow-sm border border-border/10",
        "dark:bg-white/20 dark:hover:bg-white/30 dark:text-white dark:border-white/10",
        "transition-all duration-300 ease-in-out",
        "opacity-100 scale-100"
    );

    const handleInteraction = (e: React.MouseEvent | React.TouchEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    if (collapsedText) {
        return (
            <span className="flex items-center justify-center text-sm font-semibold whitespace-normal leading-none h-6"
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <span>{collapsedText}</span>
                <ChevronRight size="0.9em" className="ml-1 inline-block opacity-70 flex-shrink-0" strokeWidth={3} />
            </span>
        );
    }

    const activeItems = items || (translation ? [{
        key: 'single',
        text: '',
        translation,
        globalIndex: -1,
        isSaved: !!isSaved
    }] : []);

    return (
        <span
            className="flex items-center flex-row flex-nowrap divide-x divide-border/20 dark:divide-white/10"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            {activeItems.map((item, idx) => {
                const isSavedOverride = savedKeys?.has(item.key) || item.isSaved || (item.key === 'single' ? isSaved : false);
                const isLoading = item.translation === "...";

                const playHandler = () => item.globalIndex === -1 ? onPlay() : onPlay(item.globalIndex);
                const infoHandler = () => item.globalIndex === -1 ? onMoreInfo() : onMoreInfo(item.globalIndex);
                const regenHandler = () => item.globalIndex === -1 ? onRegenerate() : onRegenerate(item.globalIndex);
                const saveHandler = () => item.globalIndex === -1 ? onSave() : onSave(item.globalIndex, item.translation, item.text);

                return (
                    <span
                        key={`${item.key}-${item.globalIndex}-${idx}`}
                        className="flex items-center gap-2 px-3 first:pl-0 last:pr-0 group/segment whitespace-normal h-6"
                    >
                        <span className="text-sm font-semibold leading-none">
                            <ReactMarkdown components={{ p: 'span' }}>{item.translation}</ReactMarkdown>
                        </span>

                        <div className={cn(
                            "flex items-center flex-shrink-0 gap-0.5 transition-all duration-300 ease-in-out",
                            isLoading ? "opacity-100 w-auto" : "opacity-0 group-hover/segment:opacity-100 w-0 group-hover/segment:w-auto overflow-hidden"
                        )}>
                            <button
                                className={buttonClass}
                                onClick={(e) => handleInteraction(e, playHandler)}
                                onMouseDown={(e) => e.stopPropagation()}
                                onMouseUp={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                title="Listen"
                            >
                                <Volume2 size="0.9em" strokeWidth={2.5} />
                            </button>

                            {!isLoading && (
                                <button
                                    className={buttonClass}
                                    onClick={(e) => handleInteraction(e, infoHandler)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onMouseUp={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    title="More Info"
                                >
                                    <Search size="0.9em" strokeWidth={2.5} />
                                </button>
                            )}

                            <button
                                className={buttonClass}
                                onClick={(e) => handleInteraction(e, regenHandler)}
                                onMouseDown={(e) => e.stopPropagation()}
                                onMouseUp={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                title="Regenerate Translation"
                            >
                                <RefreshCcw size="0.9em" strokeWidth={2.5} className={isLoading ? "animate-spin" : ""} />
                            </button>

                            {!isLoading && (
                                <button
                                    className={buttonClass}
                                    onClick={(e) => handleInteraction(e, saveHandler)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onMouseUp={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    title="Save Word"
                                    disabled={isSavedOverride}
                                >
                                    {isSavedOverride ? (
                                        <Check size="0.9em" strokeWidth={2.5} className="text-green-500 dark:text-green-400" />
                                    ) : (
                                        <Save size="0.9em" strokeWidth={2.5} />
                                    )}
                                </button>
                            )}
                        </div>
                    </span>
                );
            })}
        </span>
    );
}
export default ReaderTokenPopup;
