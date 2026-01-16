import { useEffect, useState } from 'react';

import { Button } from "../../../components/ui/button";
import { ChevronsUp, ChevronsDown } from "lucide-react";
import { SettingsModal } from "../../../components/settings/SettingsModal";
import { useAudioStore } from '../store/useAudioStore';
import { useReaderStore } from '../store/useReaderStore';
import { useTranslation } from '../hooks/useTranslation';
import { PlaybackControls } from './controls/PlaybackControls';
import { TimelineControl } from './controls/TimelineControl';
import { VoiceSettings } from './controls/VoiceSettings';
import { ReaderSettings, TranslationSettings } from './controls/ReaderSettings';

interface PlayerControlsProps {
    vertical?: boolean;
}

// Collapse/Expand button component for consistent positioning
function CollapseExpandButton({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 absolute top-3 right-2 z-10"
            onClick={onToggle}
            title={isCollapsed ? "Expand Player" : "Collapse Player"}
        >
            {isCollapsed ? <ChevronsDown className="h-4 w-4" /> : <ChevronsUp className="h-4 w-4" />}
        </Button>
    );
}

export function PlayerControls({ vertical = false }: PlayerControlsProps) {
    const {
        isPlaying,
        isPaused,
        playbackRate,
        selectedVoice,
        availableVoices,
        currentWordIndex,
        tokens,
        play,
        seek,
        pause,
        resume,
        stop,
        setRate,
        setVoice,
        init,
        setTokens
    } = useAudioStore();

    // Reader Store Actions
    const { text, tokens: readerTokens, clearSelection } = useReaderStore();
    const selectionMode = useReaderStore(state => state.selectionMode);
    const setSelectionMode = useReaderStore(state => state.setSelectionMode);

    // Translation Controls
    const {
        showTranslations,
        toggleShowTranslations,
        clearSelectionTranslations
    } = useTranslation();

    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        init();
    }, [init]);

    // Sync tokens
    useEffect(() => {
        // Sanitize tokens for audio: remove # tags (headers)
        // We replace them with empty strings to keep indices in sync for highlighting
        const sanitizedTokens = readerTokens.map(t => /^#+$/.test(t.trim()) ? "" : t);
        setTokens(sanitizedTokens);
    }, [readerTokens, setTokens]);

    const handlePlayPause = () => {
        if (isPlaying) {
            pause();
        } else if (isPaused) {
            resume();
        } else {
            play(text);
        }
    };

    if (!text.trim()) return null;

    if (isCollapsed) {
        return (
            <div className={`relative p-2 pr-12 border-border/40 bg-background/95 backdrop-blur z-40 flex gap-2 items-center ${vertical
                ? 'flex-col border rounded-xl shadow-sm w-16 pr-2 pt-12'
                : 'border-b w-full justify-start'
                }`}>
                <CollapseExpandButton isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

                <PlaybackControls
                    isPlaying={isPlaying}
                    isPaused={isPaused}
                    onPlayPause={handlePlayPause}
                    onStop={stop}
                    variant="mini"
                />

                {/* Mini slider for collapsed view */}
                <TimelineControl
                    currentWordIndex={currentWordIndex}
                    totalTokens={tokens.length}
                    onSeek={seek}
                    vertical={vertical}
                />

                <div className="h-6 w-px bg-border/50 mx-1" />

                {/* Translation Controls - always visible */}
                <TranslationSettings
                    showTranslations={showTranslations}
                    onToggleTranslations={toggleShowTranslations}
                    onClearTranslations={() => {
                        clearSelectionTranslations();
                        clearSelection();
                    }}
                />

                <div className="h-6 w-px bg-border/50 mx-1" />

                {/* Settings Button */}
                <SettingsModal />
            </div>
        );
    }

    return (
        <div className={`relative w-full p-2 md:p-4 pr-12 md:pr-14 border-border/40 bg-background/95 backdrop-blur z-40 flex gap-4 ${vertical
            ? 'flex-col border rounded-xl shadow-sm'
            : 'flex-col border-b'
            }`}>
            <CollapseExpandButton isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

            <div className={`flex gap-4 items-center justify-between w-full ${vertical ? 'flex-col items-stretch' : 'flex-col md:flex-row'}`}>
                <div className={`flex items-center gap-2 ${vertical ? 'justify-between' : ''}`}>

                    <PlaybackControls
                        isPlaying={isPlaying}
                        isPaused={isPaused}
                        onPlayPause={handlePlayPause}
                        onStop={stop}

                    />

                    {!vertical && <div className="h-6 w-px bg-border/50 mx-2" />}

                    {vertical && <div className="flex-1" />}

                    <ReaderSettings
                        selectionMode={selectionMode}
                        onSelectionModeChange={setSelectionMode}
                        vertical={vertical}
                    />
                </div>

                <div className={`flex items-center gap-4 flex-1 w-full ${vertical ? 'flex-col items-stretch' : 'md:w-auto overflow-hidden'}`}>

                    <VoiceSettings
                        selectedVoiceName={selectedVoice?.name}
                        availableVoices={availableVoices}
                        playbackRate={playbackRate}
                        onVoiceChange={(name) => {
                            const v = availableVoices.find(voice => voice.name === name);
                            if (v) setVoice(v);
                        }}
                        onRateChange={setRate}
                        vertical={vertical}
                    />
                </div>
            </div>

            <div className="flex gap-2 w-full justify-between items-center">

                {/* Timeline Slider */}
                <TimelineControl
                    currentWordIndex={currentWordIndex}
                    totalTokens={tokens.length}
                    onSeek={seek}
                />

                <div className="h-6 w-px bg-border/50 mx-2" />

                {/* Translation Controls */}
                <TranslationSettings
                    showTranslations={showTranslations}
                    onToggleTranslations={toggleShowTranslations}
                    onClearTranslations={() => {
                        clearSelectionTranslations();
                        clearSelection();
                    }}
                />

            </div>
        </div >
    );
};
