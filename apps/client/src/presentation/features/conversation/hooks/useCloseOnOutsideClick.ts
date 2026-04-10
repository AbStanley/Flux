import { useEffect } from 'react';

export function useCloseOnOutsideClick(
    ref: React.RefObject<HTMLElement | null>,
    onClose: () => void,
) {
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [ref, onClose]);
}
