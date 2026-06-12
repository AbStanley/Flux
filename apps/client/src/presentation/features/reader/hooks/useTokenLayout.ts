/* eslint-disable react-hooks/set-state-in-effect */
import { useLayoutEffect, useState } from 'react';

interface UseTokenLayoutProps {
    tokenRef: React.RefObject<HTMLElement | null>;
    containerRef?: React.RefObject<HTMLElement | null>;
    popupContainerRef: React.RefObject<HTMLElement | null>;
    groupTranslation: string | undefined;
    hoverTranslation: string | undefined;
    isHovered: boolean;
    isSelected: boolean;
    groupEndId?: string;
    globalIndex: number;
}

interface UseTokenLayoutResult {
    isRightAligned: boolean;
    dynamicMarginTop: number | undefined;
    dynamicMaxWidth: number | undefined;
    dynamicBottom: string | undefined;
}

export const useTokenLayout = ({
    tokenRef,
    containerRef,
    popupContainerRef,
    groupTranslation,
    hoverTranslation,
    isHovered,
    isSelected,
    groupEndId,
    globalIndex
}: UseTokenLayoutProps): UseTokenLayoutResult => {
    const [isRightAligned, setIsRightAligned] = useState(false);
    const [dynamicMarginTop, setDynamicMarginTop] = useState<number | undefined>(undefined);
    const [dynamicMaxWidth, setDynamicMaxWidth] = useState<number | undefined>(undefined);
    const [dynamicBottom, setDynamicBottom] = useState<string | undefined>(undefined);

    useLayoutEffect(() => {
        if ((groupTranslation || hoverTranslation) && tokenRef.current) {
            const rect = tokenRef.current.getBoundingClientRect();

            // Default to window bounds
            let rightEdge = window.innerWidth;
            let leftEdge = 0;

            if (containerRef?.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                rightEdge = containerRect.right;
                leftEdge = containerRect.left;
            }

            // 1. Calculate space available in container
            const containerPadding = 48; // ~3rem
            // Increased buffer to 40px to prevent horizontal scroll if content overflows slightly
            // (e.g. icons + long word)
            const internalPadding = 40;

            const spaceToRight = rightEdge - rect.left;

            const threshold = groupTranslation ? 120 : 350;

            const isRight = spaceToRight < threshold;
            setIsRightAligned(isRight);

            const containerAvailable = isRight
                ? (rect.right - leftEdge - internalPadding - containerPadding)
                : (rightEdge - rect.left - internalPadding - containerPadding);

            // 2. Calculate Visual Group Width constraint
            // The popup should not ideally be wider than the sentence itself, but MUST be wide enough to be readable.
            let groupVisualWidth = 500; // Default fallback width
            if (groupEndId) {
                const endEl = document.getElementById(groupEndId);
                if (endEl) {
                    const endRect = endEl.getBoundingClientRect();
                    // If on same line, dist is straightforward. If wrapped, it's safer to use viewport/container width
                    const onSameLine = Math.abs(rect.top - endRect.top) < 20;

                    if (onSameLine) {
                        // + endRect.width to include the last word
                        groupVisualWidth = (endRect.left - rect.left) + endRect.width;
                    } else {
                        // Multiline: The sentence definitely spans full width, so allow full container width
                        groupVisualWidth = containerAvailable;
                    }
                }
            }

            // 3. Viewport Cap (Dynamic Soft Limit)
            // Instead of 350px, use percentage of viewport (e.g., 60%) to be "dynamic"
            const viewportSoftCap = window.innerWidth * 0.90;

            const visualConstraint = Math.max(250, groupVisualWidth);

            const finalWidth = Math.min(
                containerAvailable,
                visualConstraint,
                viewportSoftCap
            );

            setDynamicMaxWidth(Math.max(200, finalWidth));

        } else {
            setDynamicMarginTop(undefined);
            setDynamicMaxWidth(undefined);
        }
    }, [groupTranslation, hoverTranslation, isHovered, isSelected, containerRef, groupEndId, tokenRef]);

    useLayoutEffect(() => {
        if (popupContainerRef.current && (groupTranslation || hoverTranslation)) {
            const el = popupContainerRef.current;
            const rect = el.getBoundingClientRect();
            
            // Simple collision detection with other popups
            const allPopups = Array.from(document.querySelectorAll('[data-popup="true"]')) as HTMLElement[];
            
            let verticalOffset = 0;

            allPopups.forEach(otherEl => {
                const otherIndexStr = otherEl.getAttribute('data-index');
                if (!otherIndexStr) return;
                const otherIndex = parseInt(otherIndexStr, 10);
                
                // Only yield to popups before us in the text to avoid cyclical adjustments
                if (otherIndex < globalIndex) {
                    const otherRect = otherEl.getBoundingClientRect();
                    
                    // Check if they are roughly on the same line (their anchors are similar)
                    const sameLine = Math.abs(rect.bottom - otherRect.bottom) < 50; 
                    
                    // Check horizontal overlap with a small buffer
                    const overlapX = rect.left < otherRect.right + 10 && rect.right > otherRect.left - 10;
                    
                    // Check vertical overlap to ensure they are actually colliding
                    const overlapY = rect.top < otherRect.bottom && rect.bottom > otherRect.top;
                    
                    if (sameLine && overlapX && overlapY) {
                        verticalOffset += (otherRect.height + 8); // 8px gap between stacked popups
                    }
                }
            });

            if (verticalOffset > 0) {
                 
                setDynamicBottom(`calc(120% + ${verticalOffset}px)`);
                 
                setDynamicMarginTop(rect.height + verticalOffset + 30);
            } else {
                 
                setDynamicBottom(undefined);
                if (rect.height > 0) {
                     
                    setDynamicMarginTop(rect.height + 30);
                }
            }
        }
     
    }, [dynamicMaxWidth, groupTranslation, hoverTranslation, popupContainerRef, globalIndex]);

    return {
        isRightAligned,
        dynamicMarginTop,
        dynamicMaxWidth,
        dynamicBottom
    };
};

