import { useState, useCallback, useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

interface Size {
    width: number;
    height: number;
}

interface UseResizableOptions {
    initialSize: Size;
    onResizeStart?: () => void;
    onResizeEnd?: (size: Size) => void;
}

export function useResizable({ initialSize, onResizeStart, onResizeEnd }: UseResizableOptions) {
    const [size, setSize] = useState<Size>(initialSize);
    const [isResizing, setIsResizing] = useState(false);
    const startPos = useRef({ x: 0, y: 0 });
    const startSize = useRef(initialSize);

    const handleResizeMouseDown = useCallback((e: ReactMouseEvent) => {
        setIsResizing(true);
        startPos.current = { x: e.clientX, y: e.clientY };
        startSize.current = size;
        onResizeStart?.();
        e.preventDefault();
        e.stopPropagation();
    }, [size, onResizeStart]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            const deltaX = e.clientX - startPos.current.x;
            const deltaY = e.clientY - startPos.current.y;

            setSize({
                width: Math.max(100, startSize.current.width + deltaX),
                height: Math.max(50, startSize.current.height + deltaY)
            });
        };

        const handleMouseUp = () => {
            if (isResizing) {
                setIsResizing(false);
                onResizeEnd?.(size);
            }
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, size, onResizeEnd]);

    return {
        size,
        setSize,
        isResizing,
        handleResizeMouseDown
    };
}
