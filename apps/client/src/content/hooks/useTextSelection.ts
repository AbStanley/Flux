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
                // Safeguard: Check if selection is inside our Shadow Host
                const host = document.getElementById('flux-reader-host');
                let selectionText = '';
                let selectionRect: DOMRect | undefined;

                // Priority 1: Check Shadow DOM Selection (for YouTube Overlay)
                if (host && host.shadowRoot) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const shadowSelection = (host.shadowRoot as any).getSelection();
                    const shadowText = shadowSelection?.toString().trim();

                    if (shadowText && shadowText.length > 0) {
                        // We found text in Shadow DOM. Now check if it's in a "selectable" area
                        // We assume if you are selecting text in Shadow DOM that isn't a control, it's valid content
                        // UNLESS it's explicitly blocked or inside the Popup controls
                        const anchor = shadowSelection?.anchorNode;
                        const element = anchor?.nodeType === Node.TEXT_NODE ? anchor.parentElement : anchor as HTMLElement;

                        // Whitelist: Must be inside .flux-selectable 
                        if (element?.closest('.flux-selectable')) {
                            selectionText = shadowText;
                            const range = shadowSelection?.getRangeAt(0);
                            selectionRect = range?.getBoundingClientRect();
                        }
                    }
                }

                // Priority 2: Standard Window Selection (if nothing found in shadow or we want to support both)
                if (!selectionText) {
                    // Start Standard Ignore Logic for Main DOM selections
                    if (host && (e.target === host || e.composedPath().includes(host))) {
                        // Check if it was an interaction with a control (button, input, select)
                        // events bubble through shadow root are retargeted to host, so we check composedPath
                        const realTarget = e.composedPath()[0] as HTMLElement;
                        if (!realTarget) return;

                        const isControl = (realTarget.tagName === 'BUTTON' ||
                            realTarget.tagName === 'SELECT' ||
                            realTarget.tagName === 'INPUT' ||
                            (typeof realTarget.closest === 'function' && (realTarget.closest('button') || realTarget.closest('select'))));

                        if (isControl) {
                            // This was a click on a button inside our UI
                            return;
                        }
                    }

                    const winSelection = window.getSelection();
                    selectionText = winSelection?.toString().trim() || '';
                    if (selectionText) {
                        const range = winSelection?.getRangeAt(0);
                        selectionRect = range?.getBoundingClientRect();
                    }
                }

                if (selectionText && selectionText.length > 0 && selectionRect) {
                    // Check if new selection
                    if (selectionRect && (selectionText !== selectionRef.current?.text)) {
                        const newSelection = {
                            text: selectionText,
                            x: selectionRect.left + window.scrollX,
                            y: selectionRect.bottom + window.scrollY + 10
                        };

                        selectionRef.current = newSelection;
                        // For Shadow DOM selections, we might need a slight delay or specific handling? 
                        // But onSelectionDetected will handle opening the popup.
                        onSelectionDetected(newSelection);
                    }
                } else if (!isHoveringRef.current) {
                    // Only clear if we are not hovering over the popup
                    selectionRef.current = null;
                    onClearSelection();
                }
            }, 0);
        };

        const handleMouseDown = (e: MouseEvent) => {
            // Safeguard: Do not clear if interaction is inside our Shadow Host
            const host = document.getElementById('flux-reader-host');
            if (host && (e.target === host || e.composedPath().includes(host))) {
                // Same logic: was it a button inside?
                const realTarget = e.composedPath()[0] as HTMLElement;
                if (!realTarget) return;

                const isControl = (realTarget.tagName === 'BUTTON' ||
                    realTarget.tagName === 'SELECT' ||
                    realTarget.tagName === 'INPUT' ||
                    (typeof realTarget.closest === 'function' && (realTarget.closest('button') || realTarget.closest('select'))));

                if (isControl) return;

                // Else, if clicking blank space in UI, maybe we want to keep selection?
                // For now, let's just return to prevent clearing
                return;
            }

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
