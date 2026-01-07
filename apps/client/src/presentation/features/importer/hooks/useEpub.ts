import { useState, useEffect, useRef, useCallback } from 'react';
import ePub from 'epubjs';
import type { Chapter } from '../utils/epubUtils';
import { processToc, extractEpubText } from '../utils/epubUtils';

export const useEpub = (file: File) => {
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExtracting, setIsExtracting] = useState(false);
    const bookRef = useRef<any>(null);

    useEffect(() => {
        const loadEpub = async () => {
            // Reset state when file changes
            setChapters([]);
            setLoading(true);

            try {
                const buffer = await file.arrayBuffer();
                const book = ePub(buffer);
                bookRef.current = book;
                await book.ready;
                const navigation = await book.loaded.navigation;

                const toc = processToc(navigation.toc);
                setChapters(toc);
                setLoading(false);
            } catch (error) {
                console.error("Error loading EPUB:", error);
                setLoading(false);
            }
        };

        loadEpub();

        return () => {
            if (bookRef.current) {
                bookRef.current.destroy();
            }
        };
    }, [file]);

    const extract = useCallback(async (selectedHrefs: Set<string>) => {
        if (selectedHrefs.size === 0 || !bookRef.current) return '';

        setIsExtracting(true);
        try {
            return await extractEpubText(bookRef.current, selectedHrefs, chapters);
        } finally {
            setIsExtracting(false);
        }
    }, [chapters]);

    return {
        chapters,
        loading,
        isExtracting,
        extract
    };
};
