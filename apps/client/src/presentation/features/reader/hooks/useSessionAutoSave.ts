import { useEffect, useRef } from 'react';
import { useReaderStore } from '../store/useReaderStore';
import { readingSessionsApi } from '@/infrastructure/api/reading-sessions';

/**
 * Auto-saves reading sessions to the server.
 * - Creates a new session when text is loaded (if none exists).
 * - Skips while generating (streaming) to avoid creating a session per token.
 * - Updates currentPage on page changes while reading (debounced).
 */
export function useSessionAutoSave() {
    const text = useReaderStore(s => s.text);
    const currentPage = useReaderStore(s => s.currentPage);
    const tokens = useReaderStore(s => s.tokens);
    const PAGE_SIZE = useReaderStore(s => s.PAGE_SIZE);
    const sessionId = useReaderStore(s => s.sessionId);
    const isReading = useReaderStore(s => s.isReading);
    const isGenerating = useReaderStore(s => s.isGenerating);
    const setSession = useReaderStore(s => s.setSession);

    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const createDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const savingRef = useRef(false);
    const creatingRef = useRef(false);

    // Auto-create session when text is loaded (with or without reading mode)
    // Skip while generating (text changes every token) and if sessionId is already set
    useEffect(() => {
        if (!text || sessionId || savingRef.current || creatingRef.current || isGenerating) return;

        // Debounce creation to wait for text to stabilize
        if (createDebounceRef.current) clearTimeout(createDebounceRef.current);
        createDebounceRef.current = setTimeout(() => {
            // Re-check conditions after debounce
            const state = useReaderStore.getState();
            if (!state.text || state.sessionId || state.isGenerating || creatingRef.current) return;

            creatingRef.current = true;
            const totalPages = Math.ceil(state.tokens.length / state.PAGE_SIZE);
            const title = state.text
                .replace(/^#{1,6}\s+/gm, '') // strip markdown headers like ### Title
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 60) + (state.text.length > 60 ? '...' : '');

            readingSessionsApi.create({
                title,
                text: state.text,
                currentPage: state.currentPage,
                totalPages,
                sourceLang: state.sourceLang,
                targetLang: state.targetLang,
            }).then((session) => {
                useReaderStore.getState().setSession(session.id, session.title);
            }).catch(console.error)
              .finally(() => { 
                creatingRef.current = false; 
              });
        }, 2000);

        return () => {
            if (createDebounceRef.current) clearTimeout(createDebounceRef.current);
        };
    }, [text, sessionId, isGenerating, setSession]);

    // Auto-update page on changes (debounced)
    useEffect(() => {
        if (!sessionId || sessionId === '_importing') return;

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            const totalPages = Math.ceil(tokens.length / PAGE_SIZE);
            readingSessionsApi.update(sessionId, { currentPage, totalPages }).catch(err => {
                // If session is not found, clear it from the store to stop further update attempts
                if (err.message?.includes('404') || err.statusCode === 404) {
                    useReaderStore.getState().setSession(null, null);
                }
                console.error('Failed to update session:', err);
            });
        }, 1000);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [sessionId, currentPage, isReading, tokens.length, PAGE_SIZE]);
}
