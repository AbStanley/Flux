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
    groups, selectionTranslations, visualGroupStarts, groupStarts, tokens,
    currentPage, PAGE_SIZE, textAreaRef, fontSize, font
}: UsePopupGroupsParams) => {
    const [popupGroups, setPopupGroups] = useState<Map<number, TranslationItem[]>>(new Map());
    const [suppressedPopupIndices, setSuppressedPopupIndices] = useState<Set<number>>(new Set());

    useLayoutEffect(() => {
        const calculateGroups = () => {
            const newPopupGroups = new Map<number, TranslationItem[]>();
            const newSuppressed = new Set<number>();

            // 1. Gather all active visual popups that are rendered
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

            // Helper to estimate popup screen span for overlap checking
            const getEstimatedSpan = (startIndex: number, translationStr: string) => {
                const startEl = document.getElementById(`token-${startIndex}`);
                if (!startEl) return null;
                const grp = groups.find(g => g.includes(startIndex));
                const lastIdx = grp ? grp[grp.length - 1] : startIndex;
                const lastEl = document.getElementById(`token-${lastIdx}`) || startEl;

                const rectStart = (startEl.querySelector('.token-text') || startEl).getBoundingClientRect();
                const rectEnd = (lastEl.querySelector('.token-text') || lastEl).getBoundingClientRect();

                const center = (rectStart.left + rectEnd.right) / 2;
                const estWidth = Math.min(400, translationStr.length * 7 + 40);
                return { left: center - estWidth / 2, right: center + estWidth / 2 };
            };

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

                    const sameLine = lastElData ? Math.abs(item.top - lastElData.top) < 12 : false;
                    const closeIndex = (item.index - lastEndIndex) <= 5;

                    let overlaps = false;
                    if (sameLine && closeIndex && !hasWordBetween) {
                        const spanLast = getEstimatedSpan(lastItem.globalIndex, lastItem.translation);
                        const spanCurrent = getEstimatedSpan(item.index, translation);

                        if (spanLast && spanCurrent) {
                            const minGap = 16;
                            overlaps = (spanLast.right + minGap > spanCurrent.left) &&
                                       (spanCurrent.right + minGap > spanLast.left);
                        } else {
                            overlaps = true;
                        }
                    }

                    if (sameLine && closeIndex && !hasWordBetween && overlaps) {
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

            // 4. Construct final maps
            groupedList.forEach(g => {
                newPopupGroups.set(g.anchorIndex, g.items);
                g.items.slice(1).forEach(item => {
                    newSuppressed.add(item.globalIndex);
                });
            });

            setPopupGroups(newPopupGroups);
            setSuppressedPopupIndices(newSuppressed);
        };

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
