import { useCallback } from 'react';

export function useFluxMessaging() {
    const sendSelection = useCallback((text: string) => {
        if (window.chrome?.runtime) {
            window.chrome.runtime.sendMessage({ type: 'TEXT_SELECTED', text });
        }
    }, []);

    const openSidePanel = useCallback(() => {
        if (window.chrome?.runtime) {
            window.chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
        }
    }, []);

    const selectAndOpen = useCallback((text: string) => {
        if (window.chrome?.storage?.local) {
            window.chrome.storage.local.set({ pendingText: text }, () => {
                sendSelection(text);
                openSidePanel();
            });
        } else {
            sendSelection(text);
            openSidePanel();
        }
    }, [sendSelection, openSidePanel]);

    return {
        sendSelection,
        openSidePanel,
        selectAndOpen
    };
}
