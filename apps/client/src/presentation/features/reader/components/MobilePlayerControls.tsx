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

interface MobilePlayerControlsProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export function MobilePlayerControls({ isCollapsed, onToggleCollapse }: MobilePlayerControlsProps) {
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
            <div className="flex md:hidden relative p-2.5 border-b w-full border-border/40 bg-background/95 backdrop-blur z-40 items-center justify-between gap-3">
                <PlaybackControls
                    isPlaying={isPlaying}
                    isPaused={isPaused}
                    onPlayPause={handlePlayPause}
                    onStop={stop}
                    variant="mini"
                />
                
                <div className="flex-1 min-w-0">
                    <TimelineControl
                        currentWordIndex={currentWordIndex}
                        totalTokens={tokens.length}
                        onSeek={seek}
                    />
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                    <CollapseExpandButton isCollapsed={isCollapsed} onToggle={onToggleCollapse} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex md:hidden w-full p-3.5 border-b border-border/40 bg-background/95 backdrop-blur z-40 flex-col gap-3.5">
            {/* Row 1: Playback Controls & Mode buttons */}
            <div className="flex items-center justify-between w-full gap-2">
                <PlaybackControls
                    isPlaying={isPlaying}
                    isPaused={isPaused}
                    onPlayPause={handlePlayPause}
                    onStop={stop}
                />
                
                <div className="flex items-center gap-1">
                    <GrammarModeToggle
                        isGrammarMode={readingMode === 'GRAMMAR'}
                        onToggle={handleGrammarToggle}
                        forceCollapsed={true}
                    />
                    
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleZenMode}
                        className="h-8 w-8 rounded-full text-muted-foreground"
                        title="Enter Zen Mode (Shortcut: Z)"
                    >
                        <Maximize2 className="h-4 w-4" />
                    </Button>

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

                    <SettingsModal />

                    <div className="w-px h-6 bg-border/60 mx-1" />

                    <CollapseExpandButton isCollapsed={isCollapsed} onToggle={onToggleCollapse} />
                </div>
            </div>

            {/* Row 2: Voice Settings & Playback Speed */}
            <div className="w-full bg-secondary/20 p-2.5 rounded-xl border border-border/40">
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
            </div>

            {/* Row 3: High-precision Timeline Slider */}
            <div className="w-full flex items-center px-1">
                <TimelineControl
                    currentWordIndex={currentWordIndex}
                    totalTokens={tokens.length}
                    onSeek={seek}
                />
            </div>

            {/* Row 4: Selection & Translation Settings */}
            <div className="flex items-center justify-between w-full gap-4">
                <div className="flex-1 max-w-[60%]">
                    <ReaderSettings
                        selectionMode={selectionMode}
                        onSelectionModeChange={setSelectionMode}
                        vertical={true}
                    />
                </div>
                
                <div className="flex items-center justify-end shrink-0 bg-secondary/35 rounded-lg px-1 py-0.5 border border-border/20">
                    <TranslationSettings
                        showTranslations={showTranslations}
                        onToggleTranslations={toggleShowTranslations}
                        onClearTranslations={() => {
                            clearSelectionTranslations(readerTokens, targetLang);
                            clearSelection();
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
