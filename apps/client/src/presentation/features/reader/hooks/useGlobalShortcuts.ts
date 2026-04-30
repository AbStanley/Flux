import { useEffect } from 'react';
import { useAudioStore } from '../store/useAudioStore';
import { useReaderStore } from '../store/useReaderStore';

export function useGlobalShortcuts() {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input or textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault();
                const { togglePlayPause } = useAudioStore.getState();
                togglePlayPause();
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                const { currentPage, setCurrentPage, tokens, PAGE_SIZE } = useReaderStore.getState();
                const totalPages = Math.ceil(tokens.length / PAGE_SIZE);
                if (currentPage < totalPages) {
                    setCurrentPage(currentPage + 1);
                }
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                const { currentPage, setCurrentPage } = useReaderStore.getState();
                if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                }
            } else if (e.code === 'KeyZ' || e.key.toLowerCase() === 'z') {
                e.preventDefault();
                const { toggleZenMode } = useReaderStore.getState();
                toggleZenMode();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
}
