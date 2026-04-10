import { useState, useRef, useEffect, useCallback } from 'react';

export function useCorrectionTooltip() {
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [tooltipPos, setTooltipPos] = useState<DOMRect | null>(null);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (hoveredId === null) return;
        const update = () => {
            const el = document.querySelector(`[data-correction-id="${hoveredId}"]`);
            if (el) setTooltipPos(el.getBoundingClientRect());
        };
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [hoveredId]);

    const onCorrectionEnter = useCallback((id: number, rect: DOMRect) => {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        setHoveredId(id);
        setTooltipPos(rect);
    }, []);

    const onCorrectionLeave = useCallback(() => {
        hideTimeoutRef.current = setTimeout(() => {
            setHoveredId(null);
            setTooltipPos(null);
        }, 100);
    }, []);

    const clearTooltip = useCallback(() => {
        setHoveredId(null);
        setTooltipPos(null);
    }, []);

    const onTooltipEnter = useCallback(() => {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    }, []);

    const onTooltipLeave = useCallback(() => {
        hideTimeoutRef.current = setTimeout(() => {
            setHoveredId(null);
            setTooltipPos(null);
        }, 100);
    }, []);

    const getPosInfo = useCallback(() => {
        if (!tooltipPos) return { style: { opacity: 0 } as React.CSSProperties, showAbove: false };
        const spaceBelow = window.innerHeight - tooltipPos.bottom;
        const showAbove = spaceBelow < 220 && tooltipPos.top > spaceBelow;
        return {
            style: {
                top: showAbove ? tooltipPos.top - 12 : tooltipPos.bottom + 12,
                left: Math.max(16, Math.min(window.innerWidth - 320, tooltipPos.left + tooltipPos.width / 2 - 160)),
                transformOrigin: showAbove ? 'bottom center' : 'top center',
            } as React.CSSProperties,
            showAbove,
        };
    }, [tooltipPos]);

    return {
        hoveredId, tooltipPos,
        onCorrectionEnter, onCorrectionLeave,
        clearTooltip, onTooltipEnter, onTooltipLeave,
        getPosInfo,
    };
}
