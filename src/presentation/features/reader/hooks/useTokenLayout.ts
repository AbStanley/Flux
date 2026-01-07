import React, { useLayoutEffect, useState } from 'react';

interface UseTokenLayoutProps {
    tokenRef: React.RefObject<any>;
    containerRef?: React.RefObject<any>;
    popupContainerRef: React.RefObject<any>;
    groupTranslation: string | undefined;
    hoverTranslation: string | undefined;
    isHovered: boolean;
    isSelected: boolean;
    groupEndId?: string;
}

interface UseTokenLayoutResult {
    isRightAligned: boolean;
    dynamicMarginTop: number | undefined;
    dynamicMaxWidth: number | undefined;
}

export const useTokenLayout = ({
    tokenRef,
    containerRef,
    popupContainerRef,
    groupTranslation,
    hoverTranslation,
    isHovered,
    isSelected,
    groupEndId
}: UseTokenLayoutProps): UseTokenLayoutResult => {
    const [isRightAligned, setIsRightAligned] = useState(false);
    const [dynamicMarginTop, setDynamicMarginTop] = useState<number | undefined>(undefined);
    const [dynamicMaxWidth, setDynamicMaxWidth] = useState<number | undefined>(undefined);

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

            const threshold = groupTranslation ? 80 : 350;

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

            // DEBUG LOGGING
            if (groupTranslation) {
                console.log('[ReaderToken] Width Calc:', {
                    containerAvailable,
                    groupVisualWidth,
                    viewportSoftCap,
                    finalWidth,
                    isRight
                });
            }

            setDynamicMaxWidth(Math.max(200, finalWidth));

        } else {
            setDynamicMarginTop(undefined);
            setDynamicMaxWidth(undefined);
        }
    }, [groupTranslation, hoverTranslation, isHovered, isSelected, containerRef, groupEndId, tokenRef]);

    // Height measurement effect (Separate to ensure it runs after width update)
    useLayoutEffect(() => {
        if (popupContainerRef.current && (groupTranslation || hoverTranslation)) {
            const height = popupContainerRef.current.offsetHeight;
            if (height > 0) {
                setDynamicMarginTop(height + 30);
            }
        }
    }, [dynamicMaxWidth, groupTranslation, hoverTranslation, popupContainerRef]);

    return {
        isRightAligned,
        dynamicMarginTop,
        dynamicMaxWidth
    };
};

