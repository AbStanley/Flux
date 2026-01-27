import { useEffect, useState } from 'react';
import { SettingsModal } from "@/presentation/components/settings/SettingsModal";
import { useAudioStore } from '../store/useAudioStore';
import { useReaderStore } from '../store/useReaderStore';
import { useTranslation } from '../hooks/useTranslation';
import { PlaybackControls } from './controls/PlaybackControls';
import { TimelineControl } from './controls/TimelineControl';
import { VoiceSettings } from './controls/VoiceSettings';
import { ReaderSettings, TranslationSettings, GrammarModeToggle } from './controls/ReaderSettings';
import { CollapseExpandButton } from './controls/CollapseExpandButton';

interface PlayerControlsProps {
    vertical?: boolean;
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
    const readingMode = useReaderStore(state => state.readingMode);
    const setReadingMode = useReaderStore(state => state.setReadingMode);

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

    const handleGrammarToggle = () => {
        setReadingMode(readingMode === 'GRAMMAR' ? 'STANDARD' : 'GRAMMAR');
    };

    if (!text.trim()) return null;

    if (isCollapsed) {
        return (
            <div className={`relative p-2 border-border/40 bg-background/95 backdrop-blur z-40 flex flex-col gap-1 ${vertical
                ? 'border rounded-xl shadow-sm w-16 pt-2'
                : 'border-b w-full'
                }`}>

                <div className="flex items-center justify-between w-full gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <PlaybackControls
                            isPlaying={isPlaying}
                            isPaused={isPaused}
                            onPlayPause={handlePlayPause}
                            onStop={stop}
                        />

                        {/* Desktop: Show nothing more. Mobile: Show Selection Mode */}
                        <div className="md:hidden">
                            <ReaderSettings
                                selectionMode={selectionMode}
                                onSelectionModeChange={setSelectionMode}
                                vertical={vertical}
                            />

                            <div className="flex-1 min-w-0 flex justify-center">
                                <div className="hidden md:block w-full max-w-[200px]">
                                    <TimelineControl
                                        currentWordIndex={currentWordIndex}
                                        totalTokens={tokens.length}
                                        onSeek={seek}
                                        vertical={vertical}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full ml-20 hidden md:block ">
                        <TimelineControl
                            currentWordIndex={currentWordIndex}
                            totalTokens={tokens.length}
                            onSeek={seek}
                            vertical={vertical}
                        />
                    </div>
                    <div className="hidden md:flex items-center gap-4 shrink-0">
                        <GrammarModeToggle
                            isGrammarMode={readingMode === 'GRAMMAR'}
                            onToggle={handleGrammarToggle}
                        />

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
                    <CollapseExpandButton isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

                </div>

                <div className="w-full md:hidden">
                    <TimelineControl
                        currentWordIndex={currentWordIndex}
                        totalTokens={tokens.length}
                        onSeek={seek}
                        vertical={vertical}
                    />
                </div>
            </div >
        );
    }

    return (
        <div className={`relative w-full p-2 md:p-4 border-border/40 bg-background/95 backdrop-blur z-40 flex gap-4 ${vertical
            ? 'flex-col border rounded-xl shadow-sm'
            : 'flex-col border-b'
            }`}>

            <div className={`flex gap-4 items-center justify-between w-full ${vertical ? 'flex-col items-stretch' : 'flex-col md:flex-row'}`}>
                {/* Left Group: Playback & Selection */}
                <div className={`flex items-center gap-2 ${vertical ? 'justify-between' : ''}`}>
                    <PlaybackControls
                        isPlaying={isPlaying}
                        isPaused={isPaused}
                        onPlayPause={handlePlayPause}
                        onStop={stop}
                    />

                    {!vertical && <div className="h-6 w-px bg-border/50 mx-2 hidden md:block" />}

                    {vertical && <div className="flex-1" />}

                    <ReaderSettings
                        selectionMode={selectionMode}
                        onSelectionModeChange={setSelectionMode}
                        vertical={vertical}
                    />
                </div>

                {/* Right Group: Voice Settings & Collapse Button */}
                <div className={`flex items-center gap-4 flex-1 w-full justify-end ${vertical ? 'flex-col items-stretch' : 'md:w-auto overflow-hidden'}`}>


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

                    <div className="shrink-0">
                        <CollapseExpandButton isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
                    </div>
                </div>
            </div>

            {/* Bottom Row: Timeline & Translations */}
            <div className="flex gap-2 w-full justify-between items-center">
                <TimelineControl
                    currentWordIndex={currentWordIndex}
                    totalTokens={tokens.length}
                    onSeek={seek}
                />

                <div className="h-6 w-px bg-border/50 mx-2" />

                <TranslationSettings
                    showTranslations={showTranslations}
                    onToggleTranslations={toggleShowTranslations}
                    onClearTranslations={() => {
                        clearSelectionTranslations();
                        clearSelection();
                    }}
                />

                {!vertical && (
                    <GrammarModeToggle
                        isGrammarMode={readingMode === 'GRAMMAR'}
                        onToggle={handleGrammarToggle}
                    />
                )}

                {/* Settings Button */}
                <SettingsModal />

                <div className="h-6 w-px bg-border/50 mx-1" />
            </div>
        </div >
    );
};
