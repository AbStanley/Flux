import { useLayoutEffect, useState, type RefObject } from 'react';
import type { TranslationItem } from '../components/ReaderTokenPopup';

export interface PopupGroup {
    anchorIndex: number;    // The global index of the token where the combined popup is rendered
    items: TranslationItem[];
}

interface UsePopupGroupsParams {
    groups: number[][];
    selectionTranslations: Map<string, string>;
    visualGroupStarts: Map<number, string>;
    groupStarts: Map<number, string>;
    tokens: string[];
    currentPage: number;
    PAGE_SIZE: number;
    textAreaRef: RefObject<HTMLDivElement | null>;
    fontSize?: string;
    font?: string;
}

export const usePopupGroups = ({
    groups,
    selectionTranslations,
    visualGroupStarts,
    groupStarts,
    tokens,
    currentPage,
    PAGE_SIZE,
    textAreaRef,
    fontSize,
    font
}: UsePopupGroupsParams) => {
    const [popupGroups, setPopupGroups] = useState<Map<number, TranslationItem[]>>(new Map());
    const [suppressedPopupIndices, setSuppressedPopupIndices] = useState<Set<number>>(new Set());

    useLayoutEffect(() => {
        const calculateGroups = () => {
            const newPopupGroups = new Map<number, TranslationItem[]>();
            const newSuppressed = new Set<number>();

            // 1. Gather all active visual popups that are rendered
            // We use visualGroupStarts if present, otherwise groupStarts
            const activeStarts = new Set<number>();
            const activeStartToTranslation = new Map<number, string>();

            const currentStartIndices = Array.from(visualGroupStarts.keys()).length > 0
                ? Array.from(visualGroupStarts.keys())
                : Array.from(groupStarts.keys());

            currentStartIndices.forEach(idx => {
                const trans = visualGroupStarts.get(idx) || groupStarts.get(idx);
                if (trans) {
                    activeStarts.add(idx);
                    activeStartToTranslation.set(idx, trans);
                }
            });

            // 2. Map start index to visual bounding box
            const activeStartElements: { index: number; el: HTMLElement; top: number; left: number; right: number }[] = [];
            activeStarts.forEach(idx => {
                const el = document.getElementById(`token-${idx}`);
                if (el) {
                    const textWrapper = el.querySelector('.token-text') || el;
                    const rect = textWrapper.getBoundingClientRect();
                    const margin = parseFloat(el.style.marginTop) || 0;
                    const naturalTop = rect.top - margin;
                    activeStartElements.push({
                        index: idx,
                        el,
                        top: naturalTop,
                        left: rect.left,
                        right: rect.right
                    });
                }
            });

            // Sort by index so we process linearly
            activeStartElements.sort((a, b) => a.index - b.index);

            console.log("Flux Debug: popup calculation details", {
                selectionTranslations: Array.from(selectionTranslations.entries()),
                groups,
                visualGroupStarts: Array.from(visualGroupStarts.entries()),
                groupStarts: Array.from(groupStarts.entries()),
                activeStarts: Array.from(activeStarts),
                activeStartElements: activeStartElements.map(e => ({ index: e.index, top: e.top })),
            });

            // 3. Horizontal Merging / Grouping
            const groupedList: PopupGroup[] = [];
            let currentGroup: PopupGroup | null = null;

            activeStartElements.forEach(item => {
                const group = groups.find(g => g.includes(item.index));
                const key = group ? `${group[0]}-${group[group.length - 1]}` : `${item.index}-${item.index}`;
                const text = group ? group.map(i => tokens[i]).join('') : tokens[item.index];
                const translation = activeStartToTranslation.get(item.index) || '';

                const popupItem: TranslationItem = {
                    key,
                    text,
                    translation,
                    globalIndex: item.index,
                    isSaved: false
                };

                if (!currentGroup) {
                    currentGroup = {
                        anchorIndex: item.index,
                        items: [popupItem]
                    };
                } else {
                    const lastItem = currentGroup.items[currentGroup.items.length - 1];
                    const lastElData = activeStartElements.find(e => e.index === lastItem.globalIndex);
                    
                    // Find the end token index of the last item's group
                    const lastGroup = groups.find(g => g.includes(lastItem.globalIndex));
                    const lastEndIndex = lastGroup ? lastGroup[lastGroup.length - 1] : lastItem.globalIndex;

                    // Verify if there are any alphabetical word/number characters in between the groups
                    let hasWordBetween = false;
                    for (let i = lastEndIndex + 1; i < item.index; i++) {
                        if (tokens[i] && /\p{L}|\p{N}/u.test(tokens[i])) {
                            hasWordBetween = true;
                            break;
                        }
                    }

                    // We check if:
                    // A. On the same visual line (top coordinates within 10px)
                    // B. Close index distance (gap between end of last and start of current <= 5 tokens)
                    // C. No untranslated content words exist in the physical gap between them
                    const sameLine = lastElData ? Math.abs(item.top - lastElData.top) < 12 : false;
                    const closeIndex = (item.index - lastEndIndex) <= 5;

                    if (sameLine && closeIndex && !hasWordBetween) {
                        currentGroup.items.push(popupItem);
                    } else {
                        groupedList.push(currentGroup);
                        currentGroup = {
                            anchorIndex: item.index,
                            items: [popupItem]
                        };
                    }
                }
            });

            if (currentGroup) {
                groupedList.push(currentGroup);
            }

            console.log("Flux Debug: groupedList result", groupedList);

            // 4. Construct final maps
            groupedList.forEach(g => {
                newPopupGroups.set(g.anchorIndex, g.items);
                // All items other than the anchor item are suppressed
                g.items.slice(1).forEach(item => {
                    newSuppressed.add(item.globalIndex);
                });
            });

            setPopupGroups(newPopupGroups);
            setSuppressedPopupIndices(newSuppressed);
        };

        // Run synchronously to avoid visual flashing of duplicate popups
        calculateGroups();

        if (!textAreaRef.current) return;

        let resizeTimer: ReturnType<typeof setTimeout>;
        const resizeObserver = new ResizeObserver(() => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                calculateGroups();
            }, 50);
        });

        resizeObserver.observe(textAreaRef.current);

        return () => {
            resizeObserver.disconnect();
            clearTimeout(resizeTimer);
        };
    }, [groups, selectionTranslations, visualGroupStarts, groupStarts, currentPage, PAGE_SIZE, tokens, textAreaRef, fontSize, font]);

    return { popupGroups, suppressedPopupIndices };
};
