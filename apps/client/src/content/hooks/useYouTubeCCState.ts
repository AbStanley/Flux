import { useState, useEffect, useRef } from 'react';

/**
 * Watches YouTube CC button state via simple polling.
 * KEY: Defaults to TRUE when button not found (player not loaded yet).
 * Only returns false when button explicitly has aria-pressed="false".
 */
export function useYouTubeCCState(isWatchPage: boolean): boolean {
    const [ccEnabled, setCcEnabled] = useState(true);
    const observerRef = useRef<MutationObserver | null>(null);

    useEffect(() => {
        if (!isWatchPage) {
            setTimeout(() => setCcEnabled(true), 0);
            return;
        }

        const read = () => {
            const btn = document.querySelector('.ytp-subtitles-button');
            // No button = player not ready OR no captions → default ON
            if (!btn) return true;
            // Button exists but no aria-pressed attr → default ON
            const val = btn.getAttribute('aria-pressed');
            if (val === null) return true;
            return val === 'true';
        };

        const update = () => setCcEnabled(read());
        update();

        // Observe stable parent for aria-pressed changes
        const attach = () => {
            observerRef.current?.disconnect();
            const parent = document.querySelector('.ytp-chrome-controls')
                || document.getElementById('movie_player');
            if (!parent) return;
            observerRef.current = new MutationObserver(update);
            observerRef.current.observe(parent, {
                attributes: true, attributeFilter: ['aria-pressed'], subtree: true,
            });
        };

        attach();
        const poll = setInterval(() => { attach(); update(); }, 500);

        return () => {
            observerRef.current?.disconnect();
            observerRef.current = null;
            clearInterval(poll);
        };
    }, [isWatchPage]);

    return ccEnabled;
}
