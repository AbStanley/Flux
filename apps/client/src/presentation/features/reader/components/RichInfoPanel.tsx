import { RichDetailsContent } from './rich-details/RichDetailsContent';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { X, Trash2, Edit } from "lucide-react";
import type { RichDetailsTab } from '../store/useTranslationStore';
import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { EditWordDialog } from '../../word-manager/components/EditWordDialog';
import { useWordsStore } from '../../word-manager/store/useWordsStore';
import { type CreateWordRequest } from '../../../../infrastructure/api/words';
import { useTranslationStore } from '../store/useTranslationStore';
import type { RichSnapState } from '../store/slices/richDetailsSlice';

interface RichInfoPanelProps {
    isOpen: boolean;
    tabs: RichDetailsTab[];
    activeTabId: string | null;
    onClose: () => void;
    onTabChange: (id: string) => void;
    onCloseTab: (id: string) => void;
    onRegenerate: (id: string) => void;
    onFetchConjugations: (id: string) => void;
    onClearAll: () => void;
    forceOverlay?: boolean;
}

const PEEK_PX = 84;
const HALF_VH = 0.4;
const FULL_VH = 0.78;
const MIN_DRAG_PX = 56;

const snapToHeightCss = (snap: RichSnapState): string => {
    if (snap === 'peek') return `${PEEK_PX}px`;
    if (snap === 'half') return `${HALF_VH * 100}vh`;
    return `${FULL_VH * 100}vh`;
};

const nextSnap = (snap: RichSnapState): RichSnapState => {
    if (snap === 'peek') return 'half';
    if (snap === 'half') return 'full';
    return 'peek';
};

export function RichInfoPanel({ isOpen, tabs, activeTabId, onClose, onTabChange, onCloseTab, onRegenerate, onFetchConjugations, onClearAll, forceOverlay }: RichInfoPanelProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const { wordsState, phrasesState, addWord, updateWord } = useWordsStore();
    const snapState = useTranslationStore(s => s.snapState);
    const setSnapState = useTranslationStore(s => s.setSnapState);

    const cardRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const dragStartY = useRef(0);
    const dragStartHeight = useRef(0);
    const [dragHeight, setDragHeight] = useState<number | null>(null);

    // Reset scroll position whenever the user switches tabs so they always
    // start reading from the top of the new word's details.
    useEffect(() => {
        const root = scrollAreaRef.current;
        if (!root) return;
        const viewport = root.querySelector<HTMLElement>(
            '[data-radix-scroll-area-viewport]',
        );
        (viewport ?? root).scrollTop = 0;
    }, [activeTabId]);

    if (!isOpen) return null;

    const activeTab = tabs.find(t => t.id === activeTabId);
    const existingWord = activeTab ? [...wordsState.items, ...phrasesState.items].find(w => w.text.toLowerCase() === activeTab.text.toLowerCase()) : undefined;
    const peekTranslation = activeTab?.data?.translation?.trim() || (activeTab?.isLoading ? 'Loading…' : '');

    const cardHeightCss = dragHeight !== null
        ? `${dragHeight}px`
        : snapToHeightCss(snapState);
    // The bottom-sheet behavior applies whenever the panel is rendered as an
    // overlay: always when forceOverlay is true, and on mobile (< 1200px) when
    // it's false. Use Tailwind hide-utilities to handle the responsive case.
    const overlayOnlyFlex = forceOverlay ? 'flex' : 'flex min-[1200px]:hidden';

    const handleDragPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        // Snap behavior is only meaningful when the panel renders as an overlay.
        if (!forceOverlay && window.innerWidth >= 1200) return;
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        dragStartY.current = e.clientY;
        dragStartHeight.current = cardRef.current?.getBoundingClientRect().height ?? PEEK_PX;
        setDragHeight(dragStartHeight.current);
    };

    const handleDragPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (dragHeight === null) return;
        const delta = dragStartY.current - e.clientY;
        const next = Math.max(MIN_DRAG_PX, Math.min(window.innerHeight * 0.92, dragStartHeight.current + delta));
        setDragHeight(next);
    };

    const handleDragPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (dragHeight === null) return;
        try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* noop */ }

        const vh = window.innerHeight;
        const peekPx = PEEK_PX;
        const halfPx = vh * HALF_VH;
        const fullPx = vh * FULL_VH;

        // Drag well below peek closes the panel
        if (dragHeight < peekPx * 0.6) {
            setDragHeight(null);
            onClose();
            return;
        }

        const targets: Array<[RichSnapState, number]> = [
            ['peek', peekPx],
            ['half', halfPx],
            ['full', fullPx],
        ];
        const nearest = targets.reduce((best, curr) =>
            Math.abs(dragHeight - curr[1]) < Math.abs(dragHeight - best[1]) ? curr : best
        )[0];

        // If the user barely moved, treat as a tap → cycle to next snap
        const moved = Math.abs(dragHeight - dragStartHeight.current) > 6;
        setSnapState(moved ? nearest : nextSnap(snapState));
        setDragHeight(null);
    };

    const handleSave = async (data: CreateWordRequest) => {
        if (existingWord) {
            await updateWord(existingWord.id, data);
        } else {
            await addWord(data);
        }
        setIsEditDialogOpen(false);
    };

    const getDefaultValues = (): Partial<CreateWordRequest> | undefined => {
        if (!activeTab?.data) return undefined;
        const { data } = activeTab;
        return {
            text: activeTab.text,
            definition: data.translation,
            explanation: data.grammar?.explanation,
            context: activeTab.context,
            sourceLanguage: activeTab.sourceLang,
            targetLanguage: activeTab.targetLang,
            examples: data.examples?.map(ex => ({
                sentence: ex.sentence,
                translation: ex.translation
            })) || []
        };
    };

    const desktopOverrides = forceOverlay
        ? ''
        : 'min-[1200px]:static min-[1200px]:!h-full min-[1200px]:w-full min-[1200px]:border min-[1200px]:shadow-sm min-[1200px]:rounded-xl min-[1200px]:z-0 min-[1200px]:bg-transparent min-[1200px]:backdrop-blur-none min-[1200px]:mt-4';

    // Always set inline height — desktop sidebar mode overrides this via
    // `min-[1200px]:!h-full` in `desktopOverrides` when the panel is sidebar-mounted.
    const cardStyle: CSSProperties = {
        height: cardHeightCss,
        transition: dragHeight !== null ? 'none' : 'height 250ms ease',
    };

    const isPeek = snapState === 'peek' && dragHeight === null;

    return (
        <Card
            ref={cardRef}
            style={cardStyle}
            className={`fixed bottom-0 right-0 z-50 w-full border-t shadow-2xl flex flex-col rounded-t-xl glass bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-in slide-in-from-bottom duration-300 ${desktopOverrides}`}
        >
            {/* Drag handle — visible whenever the panel is rendered as a bottom-sheet overlay */}
            <div
                className={`${overlayOnlyFlex} items-center justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing select-none touch-none`}
                onPointerDown={handleDragPointerDown}
                onPointerMove={handleDragPointerMove}
                onPointerUp={handleDragPointerUp}
                onPointerCancel={handleDragPointerUp}
                role="button"
                aria-label="Drag to resize"
                title="Drag to resize, tap to cycle"
            >
                <span className="block w-10 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Peek summary line — only shows when collapsed */}
            {isPeek && (
                <div
                    className={`${overlayOnlyFlex} items-center justify-between gap-2 px-4 pb-2 cursor-pointer`}
                    onClick={() => setSnapState('half')}
                    role="button"
                    aria-label="Expand details"
                >
                    <div className="flex-1 min-w-0 flex items-baseline gap-2 overflow-hidden">
                        <span className="font-semibold text-sm truncate text-primary">{activeTab?.text ?? 'Details'}</span>
                        {peekTranslation && (
                            <span className="text-xs text-muted-foreground truncate">— {peekTranslation}</span>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onClose(); }} className="h-7 w-7 shrink-0">
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )}

            <CardHeader className={`${isPeek ? (forceOverlay ? 'hidden' : 'hidden min-[1200px]:flex') : 'flex'} flex-row items-center justify-between space-y-0 p-2 border-b gap-2`}>
                <div className="flex-1 min-w-0 overflow-hidden">
                    {tabs.length > 0 && activeTabId ? (
                        <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 min-w-0 overflow-hidden">
                                <Tabs value={activeTabId} onValueChange={onTabChange} className="w-full">
                                    <ScrollArea
                                        className="w-full whitespace-nowrap pb-2"
                                        onWheel={(e) => {
                                            if (e.deltaY !== 0) {
                                                const viewport = e.currentTarget.querySelector('[data-radix-scroll-area-viewport]');
                                                if (viewport) {
                                                    viewport.scrollLeft += e.deltaY;
                                                    e.preventDefault();
                                                }
                                            }
                                        }}
                                    >
                                        <TabsList className="inline-flex w-max min-w-full justify-start h-auto p-1 bg-transparent gap-2">
                                            {tabs.map(tab => (
                                                <div key={tab.id} className="relative group shrink-0">
                                                    <TabsTrigger
                                                        value={tab.id}
                                                        className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-4 py-1.5 h-auto text-xs font-medium border border-transparent data-[state=active]:border-primary/20 transition-all flex items-center gap-2 pr-8"
                                                    >
                                                        <span className="truncate max-w-[120px]">{tab.text}</span>
                                                    </TabsTrigger>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onCloseTab(tab.id);
                                                        }}
                                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded-full p-0.5 transition-all"
                                                        title="Close Tab"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </TabsList>
                                    </ScrollArea>
                                </Tabs>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsEditDialogOpen(true)}
                                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                                title={existingWord ? "Edit Saved Word" : "Save to Words"}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClearAll}
                                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                                title="Close All Tabs"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <CardTitle className="text-xl font-bold px-2 py-1">Details</CardTitle>
                    )}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className={`${isPeek ? (forceOverlay ? 'hidden' : 'hidden min-[1200px]:block') : 'block'} flex-1 p-0 overflow-hidden`}>
                <ScrollArea ref={scrollAreaRef} className="h-full px-6 pb-6 pt-4">
                    {tabs.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                            Select a word and click "More Info" to see details.
                        </div>
                    ) : (
                        tabs.map(tab => (
                            <div key={tab.id} className={activeTabId === tab.id ? 'block' : 'hidden'}>
                                <RichDetailsContent
                                    tab={tab}
                                    onRegenerate={() => onRegenerate(tab.id)}
                                    onFetchConjugations={() => onFetchConjugations(tab.id)}
                                />
                            </div>
                        ))
                    )}
                </ScrollArea>
            </CardContent>

            <EditWordDialog
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                onSubmit={handleSave}
                initialData={existingWord}
                defaultValues={existingWord ? undefined : getDefaultValues()}
            />
        </Card>
    );
};
