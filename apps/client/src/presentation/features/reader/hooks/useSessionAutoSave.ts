import { useEffect, useRef } from 'react';
import { useReaderStore } from '../store/useReaderStore';
import { readingSessionsApi } from '@/infrastructure/api/reading-sessions';

/**
 * Auto-saves reading position to the server.
 * - Creates a new session when reading starts (if none exists).
 * - Updates currentPage on page changes (debounced).
 */
export function useSessionAutoSave() {
    const text = useReaderStore(s => s.text);
    const currentPage = useReaderStore(s => s.currentPage);
    const tokens = useReaderStore(s => s.tokens);
    const PAGE_SIZE = useReaderStore(s => s.PAGE_SIZE);
    const sourceLang = useReaderStore(s => s.sourceLang);
    const targetLang = useReaderStore(s => s.targetLang);
    const sessionId = useReaderStore(s => s.sessionId);
    const isReading = useReaderStore(s => s.isReading);
    const setSession = useReaderStore(s => s.setSession);

    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const savingRef = useRef(false);

    // Auto-create session when reading starts without one
    useEffect(() => {
        if (!isReading || !text || sessionId || savingRef.current) return;
        savingRef.current = true;

        const totalPages = Math.ceil(tokens.length / PAGE_SIZE);
        const title = text.slice(0, 60).replace(/\s+/g, ' ').trim() + (text.length > 60 ? '...' : '');

        readingSessionsApi.create({
            title,
            text,
            currentPage,
            totalPages,
            sourceLang,
            targetLang,
        }).then((session) => {
            setSession(session.id, session.title);
        }).catch(console.error)
          .finally(() => { savingRef.current = false; });
    }, [isReading, text, sessionId, tokens.length, PAGE_SIZE, currentPage, sourceLang, targetLang, setSession]);

    // Auto-update page on changes (debounced)
    useEffect(() => {
        if (!sessionId || !isReading) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            const totalPages = Math.ceil(tokens.length / PAGE_SIZE);
            readingSessionsApi.update(sessionId, { currentPage, totalPages }).catch(console.error);
        }, 1000);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [sessionId, currentPage, isReading, tokens.length, PAGE_SIZE]);
}
