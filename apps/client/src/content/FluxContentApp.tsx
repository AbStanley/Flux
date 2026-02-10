import { useState, useRef, useEffect } from 'react';
import { useAIHandler, type Mode } from './hooks/useAIHandler';
import { useTextSelection } from './hooks/useTextSelection';
import { useYouTubeSubtitles } from './hooks/useYouTubeSubtitles';
import { FluxPopup } from './components/FluxPopup';
import { YouTubeSubtitleOverlay } from './components/YouTubeSubtitleOverlay';
import { wordsApi } from '../infrastructure/api/words';

type ViewState = 'HIDDEN' | 'FAB' | 'POPUP';

interface StorageResult {
    fluxAutoSave?: boolean;
    fluxSourceLang?: string;
    fluxTargetLang?: string;
    [key: string]: unknown;
}

/**
 * FluxContentApp: The In-Page Extension UI
 * 
 * Refactored to use Content Bootstrapping pattern and Custom Hooks.
 * Now includes YouTube Subtitle integration.
 */
export function FluxContentApp() {
    const [view, setView] = useState<ViewState>('HIDDEN');
    const [selection, setSelection] = useState<{ text: string, x: number, y: number } | null>(null);
    const [mode, setMode] = useState<Mode>('TRANSLATE');
    const [targetLang, setTargetLang] = useState<string>('English');
    const [sourceLang, setSourceLang] = useState<string>('Auto');

    const [isOverlayActive, setIsOverlayActive] = useState(false);
    const [autoSave, setAutoSave] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Load persisted settings
    useEffect(() => {
        if (window.chrome?.storage?.local) {
            window.chrome.storage.local.get(['fluxAutoSave', 'fluxSourceLang', 'fluxTargetLang'], (items) => {
                const result = items as StorageResult;
                if (result.fluxAutoSave !== undefined) setAutoSave(result.fluxAutoSave);
                if (result.fluxSourceLang) setSourceLang(result.fluxSourceLang);
                if (result.fluxTargetLang) setTargetLang(result.fluxTargetLang);
            });
        }
    }, []);

    // Save settings when changed
    const handleAutoSaveChange = (enabled: boolean) => {
        setAutoSave(enabled);
        if (window.chrome?.storage?.local) {
            window.chrome.storage.local.set({ fluxAutoSave: enabled });
        }
    };

    const handleSourceLangChange = (lang: string) => {
        setSourceLang(lang);
        if (window.chrome?.storage?.local) {
            window.chrome.storage.local.set({ fluxSourceLang: lang });
        }
    };

    const handleTargetLangChange = (lang: string) => {
        setTargetLang(lang);
        if (window.chrome?.storage?.local) {
            window.chrome.storage.local.set({ fluxTargetLang: lang });
        }
    };


    const isHoveringRef = useRef(false);

    // AI Logic
    const { result, loading, error, handleAction } = useAIHandler();

    // YouTube Logic
    const { currentCue, isActive: isYouTube, pauseVideo, playVideo } = useYouTubeSubtitles();

    const onYouTubeOverlayHover = (hovering: boolean) => {
        isHoveringRef.current = hovering;
        if (hovering) {
            pauseVideo();
        } else {
            playVideo();
        }
    };

    const handleSave = async (wordText: string) => {
        setIsSaving(true);
        try {
            await wordsApi.create({
                text: wordText,
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
                context: window.location.href,
                sourceTitle: document.title
            });
            setNotification({ message: 'Saved successfully!', type: 'success' });
            setTimeout(() => setNotification(null), 3000);
        } catch (err) {
            console.error('[Flux] Failed to save word:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setNotification({ message: `Save failed: ${errorMessage}`, type: 'error' });
            setTimeout(() => setNotification(null), 5000);
        } finally {
            // Keep the "Saving..." state for a moment for UX
            setTimeout(() => setIsSaving(false), 1200);
        }
    };

    // Selection Logic
    const onSelectionDetected = async (newSelection: { text: string, x: number, y: number }) => {
        setSelection(newSelection);
        setView('POPUP');

        handleAction(newSelection.text, mode, targetLang, sourceLang);

        if (autoSave) {
            handleSave(newSelection.text);

            if (window.chrome?.storage.local) {
                window.chrome.storage.local.set({ pendingText: newSelection.text }, () => {
                    window.chrome.runtime?.sendMessage({ type: 'TEXT_SELECTED', text: newSelection.text });
                    window.chrome.runtime?.sendMessage({ type: 'OPEN_SIDE_PANEL' });
                });
            } else {
                window.chrome.runtime?.sendMessage({ type: 'TEXT_SELECTED', text: newSelection.text });
                window.chrome.runtime?.sendMessage({ type: 'OPEN_SIDE_PANEL' });
            }
        }
    };

    const onClearSelection = () => {
        if (!isHoveringRef.current) {
            setView('HIDDEN');
            setSelection(null);
        }
    };

    useTextSelection(isHoveringRef, onSelectionDetected, onClearSelection);

    useEffect(() => {
        console.log('[Flux] Component Mounted');
    }, []);

    const onManualAction = () => {
        if (selection) {
            handleAction(selection.text, mode, targetLang, sourceLang);
        }
    };

    return (
        <>
            {isYouTube && currentCue && (
                <YouTubeSubtitleOverlay
                    cue={currentCue}
                    onHover={onYouTubeOverlayHover}
                    onPopupStateChange={setIsOverlayActive}
                    targetLang={targetLang}
                    onTargetLangChange={setTargetLang}
                    sourceLang={sourceLang}
                    onSourceLangChange={setSourceLang}
                    autoSave={autoSave}
                    onAutoSaveChange={setAutoSave}
                />
            )}

            {view === 'POPUP' && selection && !isOverlayActive && (
                <FluxPopup
                    selection={selection}
                    result={result}
                    loading={loading}
                    error={error}
                    mode={mode}
                    targetLang={targetLang}
                    sourceLang={sourceLang}
                    onModeChange={setMode}
                    onLangChange={handleTargetLangChange}
                    onSourceLangChange={handleSourceLangChange}
                    onAction={onManualAction}
                    onSave={handleSave}
                    autoSave={autoSave}
                    onAutoSaveChange={handleAutoSaveChange}
                    isSaving={isSaving}
                    onClose={() => setView('HIDDEN')}
                    onMouseEnter={() => isHoveringRef.current = true}
                    onMouseLeave={() => {
                        isHoveringRef.current = false;
                        playVideo(); // Auto-play when leaving global selection popup too
                    }}
                />
            )}

            {notification && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    zIndex: 2147483647,
                    fontSize: '14px',
                    fontWeight: 500,
                    animation: 'flux-fade-in 0.3s ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    {notification.type === 'success' ? '✅' : '❌'} {notification.message}
                </div>
            )}
            <style>{`
                @keyframes flux-fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
};
