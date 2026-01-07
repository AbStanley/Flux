import { useEffect, useRef } from 'react';

export interface SelectionState {
    text: string;
    x: number;
    y: number;
}

export const useTextSelection = (
    isHoveringRef: React.MutableRefObject<boolean>,
    onSelectionDetected: (selection: SelectionState) => void,
    onClearSelection: () => void
) => {
    const selectionRef = useRef<SelectionState | null>(null);

    useEffect(() => {
        const handleMouseUp = (e: MouseEvent) => {
            setTimeout(() => {
                // Safeguard: Do not trigger if selection is inside our Shadow Host
                const host = document.getElementById('flux-reader-host');
                if (host && (e.target === host || e.composedPath().includes(host))) {
                    console.log('[Flux] Selection ignored (inside extension UI)');
                    return;
                }

                const winSelection = window.getSelection();
                const text = winSelection?.toString().trim();

                if (text && text.length > 0) {
                    const range = winSelection?.getRangeAt(0);
                    const rect = range?.getBoundingClientRect();

                    // Check if new selection
                    if (rect && text !== selectionRef.current?.text) {
                        const newSelection = {
                            text,
                            x: rect.left + window.scrollX,
                            y: rect.bottom + window.scrollY + 10
                        };

                        selectionRef.current = newSelection;
                        onSelectionDetected(newSelection);
                    }
                } else if (!isHoveringRef.current) {
                    // Only clear if we are not hovering over the popup
                    selectionRef.current = null;
                    onClearSelection();
                }
            }, 0);
        };

        const handleMouseDown = () => {
            if (!isHoveringRef.current) {
                onClearSelection();
            }
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, [isHoveringRef, onSelectionDetected, onClearSelection]);

    return { selectionRef };
};
