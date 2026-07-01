import { useState, useRef, useEffect, useCallback } from 'react';
import { useAIHandler, type Mode } from './hooks/useAIHandler';
import { useTextSelection } from './hooks/useTextSelection';
import { useYouTubeSubtitles } from './hooks/useYouTubeSubtitles';
import { FluxPopup } from './components/FluxPopup';
import { FluxFAB } from './components/FluxFAB';
import { YouTubeSubtitleOverlay } from './components/YouTubeSubtitleOverlay';
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
    const [selection, setSelection] = useState<{ text: string; x: number; y: number; fabX?: number; fabY?: number } | null>(null);
    const [mode, setMode] = useState<Mode>('TRANSLATE');
    const [isOverlayActive, setIsOverlayActive] = useState(false);
    const [isPinned, setIsPinnedState] = useState(false);
    const [autoShowPopup, setAutoShowPopup] = useState(true);
    const isPinnedRef = useRef(false);

    const { aiService } = useServices();
    const settings = useChromeSettings(aiService);
    const { notification, isSaving, setIsSaving, showNotification } = useNotification();
    const { result, loading, error, handleAction, cancel } = useAIHandler({ isGlobal: true });

    const theme = useFluxTheme(settings.themeId, settings.customThemes);
    useFluxModelSync(settings.selectedModel, aiService, cancel);

    const {
        currentCue: activeCue, prevCue, history, clearHistory, isActive: isYouTube,
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

    const onSelectionDetected = async (newSel: { text: string; x: number; y: number; fabX?: number; fabY?: number }) => {
        setSelection(newSel);
        if (autoShowPopup) {
            setView('POPUP');
            const res = await handleAction(newSel.text, mode, settings.targetLang, settings.sourceLang);
            if (settings.autoSave) {
                handleSave(newSel.text, res?.response);
                window.chrome?.runtime?.sendMessage?.({ type: 'TEXT_SELECTED', text: newSel.text });
                window.chrome?.runtime?.sendMessage?.({ type: 'OPEN_SIDE_PANEL' });
            }
        } else {
            setView('FAB');
        }
    };

    const handleTriggerPopup = async () => {
        if (!selection) return;
        setAutoShowPopup(true);
        setView('POPUP');
        const res = await handleAction(selection.text, mode, settings.targetLang, settings.sourceLang);
        if (settings.autoSave) {
            handleSave(selection.text, res?.response);
            window.chrome?.runtime?.sendMessage?.({ type: 'TEXT_SELECTED', text: selection.text });
            window.chrome?.runtime?.sendMessage?.({ type: 'OPEN_SIDE_PANEL' });
        }
    };

    useTextSelection(isHoveringRef, onSelectionDetected, useCallback(() => {
        if (!isHoveringRef.current && !isPinnedRef.current) { setView('HIDDEN'); setSelection(null); }
    }, []));

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
            {isYouTube && settings.fluxEnabled && (
                <YouTubeSubtitleOverlay
                    activeCue={activeCue} prevCue={prevCue} historyCount={history.length}
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
                    ytOpacity={settings.ytOpacity} ytBlur={settings.ytBlur}
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

            {view === 'FAB' && selection && settings.fluxEnabled && (
                <FluxFAB
                    x={selection.fabX ?? selection.x}
                    y={selection.fabY ?? selection.y}
                    theme={theme}
                    onClick={handleTriggerPopup}
                    onMouseEnter={() => { isHoveringRef.current = true; }}
                    onMouseLeave={() => { isHoveringRef.current = false; }}
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
                    isSaving={isSaving} onClose={() => {
                        isHoveringRef.current = false;
                        setView('HIDDEN');
                        setAutoShowPopup(false);
                        window.getSelection()?.removeAllRanges();
                        const host = document.getElementById('flux-reader-host');
                        if (host && host.shadowRoot) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (host.shadowRoot as any).getSelection()?.removeAllRanges();
                        }
                    }}
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
