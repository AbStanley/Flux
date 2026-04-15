import { useState, useRef, useEffect, useCallback } from 'react';
import { useAIHandler, type Mode } from './hooks/useAIHandler';
import { useTextSelection } from './hooks/useTextSelection';
import { useYouTubeSubtitles } from './hooks/useYouTubeSubtitles';
import { FluxPopup } from './components/FluxPopup';
import { YouTubeSubtitleOverlay } from './components/YouTubeSubtitleOverlay';
import { UniversalSubtitleOverlay } from './components/universal-subs/UniversalSubtitleOverlay';
import { VideoPickerOverlay } from './components/universal-subs/VideoPickerOverlay';
import { wordsApi } from '../infrastructure/api/words';
import { useServices } from '../presentation/contexts/ServiceContext';
import { useReaderStore } from '../presentation/features/reader/store/useReaderStore';
import { THEMES, DEFAULT_THEME, type FluxTheme } from './constants';
import { useChromeSettings } from './hooks/useChromeSettings';
import { useNotification } from './hooks/useNotification';
import { useVideoDetector } from './hooks/useVideoDetector';
import { useSubtitleTracks } from './hooks/useSubtitleTracks';
import { useVideoSync } from './hooks/useVideoSync';

type ViewState = 'HIDDEN' | 'FAB' | 'POPUP';

export function FluxContentApp() {
    const [view, setView] = useState<ViewState>('HIDDEN');
    const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
    const [mode, setMode] = useState<Mode>('TRANSLATE');
    const [isOverlayActive, setIsOverlayActive] = useState(false);

    const { aiService } = useServices();
    const settings = useChromeSettings(aiService);
    const { notification, isSaving, setIsSaving, showNotification } = useNotification();

    const theme: FluxTheme = THEMES[settings.themeId] || THEMES[DEFAULT_THEME];

    // Sync model to aiService + reader store
    const setAiModel = useReaderStore((s) => s.setAiModel);
    useEffect(() => {
        if (settings.selectedModel) {
            aiService.setModel(settings.selectedModel);
            setAiModel(settings.selectedModel);
        }
    }, [settings.selectedModel, aiService, setAiModel]);


    const isHoveringRef = useRef(false);
    const wasPlayingBeforeHover = useRef(false);

    const { result, loading, error, handleAction } = useAIHandler();

    const {
        currentCue, isActive: isYouTube,
        pauseVideo, playVideo, getIsPlaying,
        seekPrev, seekNext, hasPrev, hasNext,
    } = useYouTubeSubtitles();

    // Universal Subtitle Logic (non-YouTube videos)
    const videoDetector = useVideoDetector();
    const { selectedVideo, isPicking, scannedVideos, selectVideo: pickVideo, cancelPicking } = videoDetector;
    const subtitleTracks = useSubtitleTracks();
    const videoSync = useVideoSync(selectedVideo, subtitleTracks.tracks);
    const { activeCues, currentTime: subCurrentTime } = videoSync;
    const showUniversalSubs = !isYouTube && !!selectedVideo && settings.fluxEnabled;

    const onYouTubeOverlayHover = useCallback((hovering: boolean) => {
        isHoveringRef.current = hovering;
        if (hovering) {
            wasPlayingBeforeHover.current = getIsPlaying();
            pauseVideo();
        } else if (wasPlayingBeforeHover.current) {
            playVideo();
        }
    }, [pauseVideo, playVideo, getIsPlaying]);

    const handleSave = async (wordText: string, definition?: string) => {
        setIsSaving(true);
        try {
            await wordsApi.create({
                text: wordText,
                definition: definition || undefined,
                sourceLanguage: settings.sourceLang,
                targetLanguage: settings.targetLang,
                context: window.location.href,
                sourceTitle: document.title,
            });
            showNotification('Saved successfully!', 'success', 3000);
        } catch (err) {
            console.error('[Flux] Failed to save word:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            showNotification(`Save failed: ${errorMessage}`, 'error', 5000);
        } finally {
            setTimeout(() => setIsSaving(false), 1200);
        }
    };

    // Language/mode handlers that also re-trigger AI when popup is open
    const handleSourceLangChange = (lang: string) => {
        settings.persistSourceLang(lang);
        if (view === 'POPUP' && selection && !isOverlayActive) {
            handleAction(selection.text, mode, settings.targetLang, lang);
        }
    };

    const handleTargetLangChange = (lang: string) => {
        settings.persistTargetLang(lang);
        if (view === 'POPUP' && selection && !isOverlayActive) {
            handleAction(selection.text, mode, lang, settings.sourceLang);
        }
    };

    const handleModeChange = (newMode: Mode) => {
        setMode(newMode);
        if (view === 'POPUP' && selection && !isOverlayActive) {
            handleAction(selection.text, newMode, settings.targetLang, settings.sourceLang);
        }
    };

    const handleSwapLanguages = () => {
        const { newSource, newTarget } = settings.swapLanguages();
        if (view === 'POPUP' && selection && !isOverlayActive) {
            handleAction(selection.text, mode, newTarget, newSource);
        }
    };

    const onSelectionDetected = async (newSelection: { text: string; x: number; y: number }) => {
        setSelection(newSelection);
        setView('POPUP');

        await handleAction(newSelection.text, mode, settings.targetLang, settings.sourceLang);
        // Don't persist auto-detected language — keep 'Auto' so it works on any page

        if (settings.autoSave) {
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

        // Listen for messages from the popup/background
        const onMessage = (message: { type: string }) => {
            if (message.type === 'SCAN_SUBTITLES') {
                startPicking();
            }
        };
        window.chrome?.runtime?.onMessage?.addListener(onMessage);
        return () => { window.chrome?.runtime?.onMessage?.removeListener(onMessage); };
    }, [startPicking]);

    const onManualAction = async () => {
        if (selection) {
            await handleAction(selection.text, mode, settings.targetLang, settings.sourceLang);
        }
    };

    return (
        <>
            {isYouTube && currentCue && settings.fluxEnabled && (
                <YouTubeSubtitleOverlay
                    cue={currentCue}
                    onHover={onYouTubeOverlayHover}
                    onPopupStateChange={setIsOverlayActive}
                    targetLang={settings.targetLang}
                    onTargetLangChange={handleTargetLangChange}
                    sourceLang={settings.sourceLang}
                    onSourceLangChange={handleSourceLangChange}
                    autoSave={settings.autoSave}
                    onAutoSaveChange={settings.persistAutoSave}
                    onPrev={seekPrev}
                    onNext={seekNext}
                    hasPrev={hasPrev}
                    hasNext={hasNext}
                    fluxEnabled={settings.fluxEnabled}
                    theme={theme}
                />
            )}

            {showUniversalSubs && (
                <UniversalSubtitleOverlay
                    video={selectedVideo!}
                    activeCues={activeCues}
                    tracks={subtitleTracks.tracks}
                    currentTime={subCurrentTime}
                    targetLang={settings.targetLang}
                    sourceLang={settings.sourceLang}
                    onTargetLangChange={handleTargetLangChange}
                    onSourceLangChange={handleSourceLangChange}
                    onAddFiles={subtitleTracks.addFiles}
                    onAddUrl={subtitleTracks.addTrackFromUrl}
                    onRemoveTrack={subtitleTracks.removeTrack}
                    onToggleVisibility={subtitleTracks.toggleVisibility}
                    onSetOffset={subtitleTracks.setOffset}
                    theme={theme}
                    isManualMode={videoSync.isManualMode}
                    manualPlaying={videoSync.manualPlaying}
                    onToggleManualPlay={videoSync.toggleManualPlay}
                    onManualSeek={videoSync.seekManual}
                />
            )}

            {view === 'POPUP' && selection && !isOverlayActive && settings.fluxEnabled && (
                <FluxPopup
                    selection={selection}
                    result={result}
                    loading={loading}
                    error={error}
                    mode={mode}
                    targetLang={settings.targetLang}
                    sourceLang={settings.sourceLang}
                    onModeChange={handleModeChange}
                    onLangChange={handleTargetLangChange}
                    onSourceLangChange={handleSourceLangChange}
                    onSwapLanguages={handleSwapLanguages}
                    onAction={onManualAction}
                    onSave={handleSave}
                    autoSave={settings.autoSave}
                    onAutoSaveChange={settings.persistAutoSave}
                    isSaving={isSaving}
                    onClose={() => setView('HIDDEN')}
                    onMouseEnter={() => (isHoveringRef.current = true)}
                    onMouseLeave={() => { isHoveringRef.current = false; }}
                    theme={theme}
                    themeId={settings.themeId}
                    onThemeChange={settings.persistTheme}
                    model={settings.selectedModel}
                    availableModels={settings.availableModels}
                    onModelChange={settings.persistModel}
                    collapsed={settings.popupCollapsed}
                    onCollapsedChange={settings.persistPopupCollapsed}
                />
            )}

            {notification && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px',
                    backgroundColor: notification.type === 'success' ? theme.success : theme.error,
                    color: 'white', padding: '12px 20px', borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    zIndex: 2147483647, fontSize: '14px', fontWeight: 500,
                    animation: 'flux-fade-in 0.3s ease-out',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                    {notification.type === 'success' ? '✅' : '❌'} {notification.message}
                </div>
            )}
            {/* Video picker overlay */}
            {isPicking && (
                <VideoPickerOverlay
                    videos={scannedVideos}
                    onSelect={pickVideo}
                    onCancel={cancelPicking}
                    theme={theme}
                />
            )}

            {/* CC scan button removed — video scanning is accessible via the extension popup */}

            <style>{`
                @keyframes flux-fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </>
    );
}
