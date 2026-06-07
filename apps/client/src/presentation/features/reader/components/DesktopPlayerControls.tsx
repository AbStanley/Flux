import { SettingsModal } from "@/presentation/components/settings/SettingsModal";
import { useAudioStore } from '../store/useAudioStore';
import { useReaderStore } from '../store/useReaderStore';
import { useTranslation } from '../hooks/useTranslation';
import { useTranslationStore } from '../store/useTranslationStore';
import { PlaybackControls } from './controls/PlaybackControls';
import { TimelineControl } from './controls/TimelineControl';
import { VoiceSettings } from './controls/VoiceSettings';
import { ReaderSettings, TranslationSettings, GrammarModeToggle } from './controls/ReaderSettings';
import { CollapseExpandButton } from './controls/CollapseExpandButton';
import { Button } from "@/presentation/components/ui/button";
import { cn } from "@/lib/utils";
import { PanelRightClose, PanelRightOpen, Maximize2 } from 'lucide-react';

interface DesktopPlayerControlsProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export function DesktopPlayerControls({ isCollapsed, onToggleCollapse }: DesktopPlayerControlsProps) {
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
        setVoice
    } = useAudioStore();

    const { tokens: readerTokens, targetLang, clearSelection, toggleZenMode } = useReaderStore();
    const selectionMode = useReaderStore(state => state.selectionMode);
    const setSelectionMode = useReaderStore(state => state.setSelectionMode);
    const readingMode = useReaderStore(state => state.readingMode);
    const setReadingMode = useReaderStore(state => state.setReadingMode);

    const {
        showTranslations,
        toggleShowTranslations,
        clearSelectionTranslations
    } = useTranslation();

    const isRichInfoOpen = useTranslationStore(state => state.isRichInfoOpen);
    const shouldCollapseGrammar = isRichInfoOpen && readingMode !== 'GRAMMAR';

    const handlePlayPause = () => {
        if (isPlaying) pause();
        else if (isPaused) resume();
        else play();
    };

    const handleGrammarToggle = () => {
        setReadingMode(readingMode === 'GRAMMAR' ? 'STANDARD' : 'GRAMMAR');
    };

    if (isCollapsed) {
        return (
            <div className="hidden md:flex relative p-2 border-b w-full border-border/40 bg-background/95 backdrop-blur z-40 items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <PlaybackControls
                        isPlaying={isPlaying}
                        isPaused={isPaused}
                        onPlayPause={handlePlayPause}
                        onStop={stop}
                    />
                </div>
                <div className="w-full ml-20 hidden md:block">
                    <TimelineControl
                        currentWordIndex={currentWordIndex}
                        totalTokens={tokens.length}
                        onSeek={seek}
                    />
                </div>
                <div className="hidden md:flex items-center gap-2 shrink-0">
                    <ReaderSettings
                        selectionMode={selectionMode}
                        onSelectionModeChange={setSelectionMode}
                    />
                    <TranslationSettings
                        showTranslations={showTranslations}
                        onToggleTranslations={toggleShowTranslations}
                        onClearTranslations={() => {
                            clearSelectionTranslations(readerTokens, targetLang);
                            clearSelection();
                        }}
                    />
                </div>
                <CollapseExpandButton isCollapsed={isCollapsed} onToggle={onToggleCollapse} />
            </div>
        );
    }

    return (
        <div className="hidden md:flex w-full p-2 border-b border-border/40 bg-background/95 backdrop-blur z-40 flex-col gap-2">
            {/* Top Row: Playback & Selection */}
            <div className="flex gap-2 items-center justify-between w-full">
                <div className="flex items-center gap-2">
                    <PlaybackControls
                        isPlaying={isPlaying}
                        isPaused={isPaused}
                        onPlayPause={handlePlayPause}
                        onStop={stop}
                    />
                    <div className="h-6 w-px bg-border/50 mx-2 hidden md:block" />
                    <GrammarModeToggle
                        isGrammarMode={readingMode === 'GRAMMAR'}
                        onToggle={handleGrammarToggle}
                        forceCollapsed={shouldCollapseGrammar}
                    />
                </div>

                <div className="flex items-center gap-2 flex-1 w-full justify-end md:w-auto overflow-hidden">
                    <VoiceSettings
                        selectedVoiceName={selectedVoice?.name}
                        availableVoices={availableVoices}
                        playbackRate={playbackRate}
                        onVoiceChange={(name) => {
                            const v = availableVoices.find(voice => voice.name === name);
                            if (v) setVoice(v);
                        }}
                        onRateChange={setRate}
                    />
                    <div className="shrink-0">
                        <CollapseExpandButton isCollapsed={isCollapsed} onToggle={onToggleCollapse} />
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
                        clearSelectionTranslations(readerTokens, targetLang);
                        clearSelection();
                    }}
                />

                <div className="h-6 w-px bg-border/50 mx-2" />

                <ReaderSettings
                    selectionMode={selectionMode}
                    onSelectionModeChange={setSelectionMode}
                />

                <SettingsModal />

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => useTranslationStore.getState().toggleRichInfo()}
                    className={cn(
                        "h-8 w-8 rounded-full transition-all",
                        isRichInfoOpen ? "text-primary bg-primary/10" : "text-muted-foreground"
                    )}
                    title="Toggle Details Panel"
                >
                    {isRichInfoOpen ? (
                        <PanelRightClose className="h-4 w-4" />
                    ) : (
                        <PanelRightOpen className="h-4 w-4" />
                    )}
                </Button>

                <div className="h-6 w-px bg-border/50 mx-1" />

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleZenMode}
                    className="h-8 w-8 rounded-full text-muted-foreground"
                    title="Enter Zen Mode (Shortcut: Z)"
                >
                    <Maximize2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
