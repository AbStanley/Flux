import { useState, useRef, useEffect, useCallback } from 'react';
import { useAIHandler, type Mode } from './hooks/useAIHandler';
import { useTextSelection } from './hooks/useTextSelection';
import { useYouTubeSubtitles } from './hooks/useYouTubeSubtitles';
import { FluxPopup } from './components/FluxPopup';
import { YouTubeSubtitleOverlay } from './components/YouTubeSubtitleOverlay';
import { YouTubeService } from './services/YouTubeService';
import { UniversalSubtitleOverlay } from './components/universal-subs/UniversalSubtitleOverlay';
import { VideoPickerOverlay } from './components/universal-subs/VideoPickerOverlay';
import { wordsApi } from '../infrastructure/api/words';
import { useServices } from '../presentation/contexts/ServiceContext';
import { useChromeSettings } from './hooks/useChromeSettings';
import { useNotification } from './hooks/useNotification';
import { useFluxUniversalSubtitles } from './hooks/useFluxUniversalSubtitles';
import { FluxNotification } from './components/FluxNotification';
import { useFluxTheme } from './hooks/useFluxTheme';
import { useFluxModelSync } from './hooks/useFluxModelSync';
import { useReaderStore } from '../presentation/features/reader/store/useReaderStore';

type ViewState = 'HIDDEN' | 'FAB' | 'POPUP';

export function FluxContentApp() {
    const [view, setView] = useState<ViewState>('HIDDEN');
    const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
    const [mode, setMode] = useState<Mode>('TRANSLATE');
    const [isOverlayActive, setIsOverlayActive] = useState(false);
    const [isPinned, setIsPinnedState] = useState(false);
    const isPinnedRef = useRef(false);

    const { aiService } = useServices();
    const settings = useChromeSettings(aiService);
    const { notification, isSaving, setIsSaving, showNotification } = useNotification();
    const { result, loading, error, handleAction, cancel } = useAIHandler({ isGlobal: true });

    const theme = useFluxTheme(settings.themeId, settings.customThemes);
    useFluxModelSync(settings.selectedModel, aiService, cancel);

    const {
        currentCue, history, clearHistory, isActive: isYouTube,
        pauseVideo, playVideo, getIsPlaying,
        seekPrev, seekNext, hasPrev, hasNext,
    } = useYouTubeSubtitles(settings.fluxEnabled);

    const uni = useFluxUniversalSubtitles();
    const showUniversalSubs = !isYouTube && uni.showUniversalSubs && settings.fluxEnabled;

    const isHoveringRef = useRef(false);
    const wasPlayingBeforeHover = useRef(false);

    const onYouTubeOverlayHover = useCallback((hovering: boolean) => {
        if (isHoveringRef.current === hovering) return;
        isHoveringRef.current = hovering;
        if (hovering) {
            wasPlayingBeforeHover.current = getIsPlaying();
            pauseVideo();
            window.getSelection()?.removeAllRanges();
        } else if (wasPlayingBeforeHover.current) {
            playVideo();
        }
    }, [pauseVideo, playVideo, getIsPlaying]);

    const handleSave = async (wordText: string, definition?: string) => {
        const token = await import('../infrastructure/api/api-client').then(m => m.getAuthToken());
        if (!token) {
            showNotification('Please log in via the extension popup to save words.', 'error', 5000);
            return;
        }
        setIsSaving(true);
        try {
            await wordsApi.create({
                text: wordText, definition: definition || undefined,
                sourceLanguage: settings.sourceLang, targetLanguage: settings.targetLang,
                context: window.location.href, sourceTitle: document.title,
            });
            showNotification('Saved successfully!', 'success', 3000);
            await window.chrome?.runtime?.sendMessage?.({ type: 'WORD_SAVED' });
        } catch (err) {
            showNotification(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error', 5000);
        } finally {
            setTimeout(() => setIsSaving(false), 1200);
        }
    };

    const handleActionSync = (newText: string, newMode: Mode, tLang: string, sLang: string) => {
        if (view === 'POPUP' && selection && !isOverlayActive) handleAction(newText, newMode, tLang, sLang);
    };

    const onSelectionDetected = async (newSel: { text: string; x: number; y: number }) => {
        setSelection(newSel);
        setView('POPUP');
        const res = await handleAction(newSel.text, mode, settings.targetLang, settings.sourceLang);
        if (settings.autoSave) {
            handleSave(newSel.text, res?.response);
            window.chrome?.runtime?.sendMessage?.({ type: 'TEXT_SELECTED', text: newSel.text });
            window.chrome?.runtime?.sendMessage?.({ type: 'OPEN_SIDE_PANEL' });
        }
    };

    useTextSelection(isHoveringRef, onSelectionDetected, useCallback(() => {
        if (!isHoveringRef.current && !isPinnedRef.current) { setView('HIDDEN'); setSelection(null); }
    }, []));

    useEffect(() => {
        if (isYouTube) {
            if (settings.fluxEnabled) {
                YouTubeService.hideNativeSubtitles();
            } else {
                YouTubeService.showNativeSubtitles();
            }
        }
    }, [isYouTube, settings.fluxEnabled]);

    useEffect(() => {
        const onMsg = (m: { type: string }) => {
            if (m.type === 'SCAN_SUBTITLES') {
                uni.videoDetector.startPicking();
            }
        };
        window.chrome?.runtime?.onMessage?.addListener(onMsg);
        return () => window.chrome?.runtime?.onMessage?.removeListener(onMsg);
    }, [uni.videoDetector]);

    return (
        <>
            {isYouTube && currentCue && settings.fluxEnabled && (
                <YouTubeSubtitleOverlay
                    cue={currentCue} historyCount={history.length}
                    onExport={() => {
                        if (history.length > 0) {
                            const cleanText = history.map(t => t.trim()).filter(Boolean).join('\n');
                            useReaderStore.getState().loadText(cleanText);
                            showNotification('Subtitles exported to Reader!', 'success', 3000);
                            clearHistory();
                            window.chrome?.runtime?.sendMessage?.({ type: 'OPEN_SIDE_PANEL' });
                        }
                    }}
                    onHover={onYouTubeOverlayHover} onPopupStateChange={setIsOverlayActive}
                    targetLang={settings.targetLang} onTargetLangChange={settings.persistTargetLang}
                    sourceLang={settings.sourceLang} onSourceLangChange={settings.persistSourceLang}
                    onPrev={seekPrev} onNext={seekNext} hasPrev={hasPrev} hasNext={hasNext}
                    fluxEnabled={settings.fluxEnabled} theme={theme}
                />
            )}
            {showUniversalSubs && (
                <UniversalSubtitleOverlay
                    video={uni.videoDetector.selectedVideo!} activeCues={uni.activeCues}
                    tracks={uni.subtitleTracks.tracks} currentTime={uni.currentTime}
                    targetLang={settings.targetLang} sourceLang={settings.sourceLang}
                    onTargetLangChange={settings.persistTargetLang} onSourceLangChange={settings.persistSourceLang}
                    onAddFiles={uni.subtitleTracks.addFiles} onAddUrl={uni.subtitleTracks.addTrackFromUrl}
                    onRemoveTrack={uni.subtitleTracks.removeTrack} onToggleVisibility={uni.subtitleTracks.toggleVisibility}
                    onSetOffset={uni.subtitleTracks.setOffset} theme={theme}
                    isManualMode={uni.videoSync.isManualMode} manualPlaying={uni.videoSync.manualPlaying}
                    onToggleManualPlay={uni.videoSync.toggleManualPlay} onManualSeek={uni.videoSync.seekManual}
                />
            )}

            {view === 'POPUP' && selection && !isOverlayActive && settings.fluxEnabled && (
                <FluxPopup
                    selection={selection} result={result} loading={loading} error={error} mode={mode}
                    targetLang={settings.targetLang} sourceLang={settings.sourceLang}
                    onModeChange={(m) => { setMode(m); handleActionSync(selection.text, m, settings.targetLang, settings.sourceLang); }}
                    onLangChange={(l) => { settings.persistTargetLang(l); handleActionSync(selection.text, mode, l, settings.sourceLang); }}
                    onSourceLangChange={(l) => { settings.persistSourceLang(l); handleActionSync(selection.text, mode, settings.targetLang, l); }}
                    onSwapLanguages={() => { const { newSource, newTarget } = settings.swapLanguages(); handleActionSync(selection.text, mode, newTarget, newSource); }}
                    onAction={() => handleAction(selection.text, mode, settings.targetLang, settings.sourceLang)}
                    onSave={handleSave} autoSave={settings.autoSave} onAutoSaveChange={settings.persistAutoSave}
                    isSaving={isSaving} onClose={() => setView('HIDDEN')}
                    onMouseEnter={() => (isHoveringRef.current = true)} onMouseLeave={() => (isHoveringRef.current = false)}
                    theme={theme} themeId={settings.themeId} onThemeChange={settings.persistTheme}
                    model={settings.selectedModel} availableModels={settings.availableModels}
                    onModelChange={settings.persistModel} collapsed={settings.popupCollapsed}
                    onCollapsedChange={settings.persistPopupCollapsed} isPinned={isPinned} onPinChange={(p) => { isPinnedRef.current = p; setIsPinnedState(p); }}
                />
            )}

            {notification && <FluxNotification message={notification.message} type={notification.type} theme={theme} />}
            {uni.videoDetector.isPicking && (
                <VideoPickerOverlay videos={uni.videoDetector.scannedVideos} onSelect={uni.videoDetector.selectVideo} onCancel={uni.videoDetector.cancelPicking} theme={theme} />
            )}
            <style>{`@keyframes flux-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </>
    );
}
