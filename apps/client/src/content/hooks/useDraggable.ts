import { useState, useRef, useEffect, useCallback } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

interface Position {
    x: number;
    y: number;
}

interface UseDraggableOptions {
    initialPos: Position;
    onDragStart?: () => void;
    onDragEnd?: () => void;
}

export function useDraggable({ initialPos, onDragStart, onDragEnd }: UseDraggableOptions) {
    const [pos, setPos] = useState<Position>(initialPos);
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef<Position>({ x: 0, y: 0 });

    const handleMouseDown = useCallback((e: ReactMouseEvent) => {
        setIsDragging(true);
        dragStart.current = {
            x: e.clientX - pos.x,
            y: e.clientY - pos.y
        };
        onDragStart?.();
        e.preventDefault();
    }, [pos, onDragStart]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setPos({
                x: e.clientX - dragStart.current.x,
                y: e.clientY - dragStart.current.y
            });
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                onDragEnd?.();
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, onDragEnd]);

    return {
        pos,
        setPos,
        isDragging,
        handleMouseDown
    };
}
