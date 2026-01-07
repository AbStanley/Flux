import { useRef, useCallback } from 'react';

interface LongPressOptions {
    threshold?: number;
    onLongPress: (e: React.MouseEvent | React.TouchEvent) => void;
    onClick?: (e: React.MouseEvent | React.TouchEvent) => void;
}

export const useLongPress = ({
    threshold = 500,
    onLongPress,
    onClick
}: LongPressOptions) => {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressRef = useRef(false);
    const startedRef = useRef(false); // Track if this element initiated the press

    const start = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            startedRef.current = true;
            isLongPressRef.current = false;
            timerRef.current = setTimeout(() => {
                isLongPressRef.current = true;
                onLongPress(e);
            }, threshold);
        },
        [onLongPress, threshold]
    );

    const clear = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }

            if (startedRef.current && !isLongPressRef.current && onClick) {
                onClick(e);
            }
            startedRef.current = false;
        },
        [onClick]
    );

    return {
        onMouseDown: start,
        onMouseUp: clear,
        onMouseLeave: (_e: any) => {
            // Cancel if mouse leaves
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        },
        onTouchStart: start,
        onTouchEnd: clear,
    };
};
