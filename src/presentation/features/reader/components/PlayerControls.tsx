import React, { useEffect } from 'react';
import { Button } from "../../../components/ui/button";
import { Slider } from "../../../components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Play, Pause, Square, Volume2, Eye, EyeOff, Eraser } from "lucide-react";
import { useAudioStore } from '../store/useAudioStore';
import { useReaderStore } from '../store/useReaderStore';
import { useTranslation } from '../hooks/useTranslation';
import { SelectionMode } from '../../../../core/types';

interface PlayerControlsProps {
    vertical?: boolean;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({ vertical = false }) => {
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

    // Translation Controls
    const {
        showTranslations,
        toggleShowTranslations,
        clearSelectionTranslations
    } = useTranslation();

    // Local state for smooth slider movement
    const [sliderValue, setSliderValue] = React.useState([0]);
    const isDragging = React.useRef(false);

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

    // Sync slider with playback only when not dragging
    useEffect(() => {
        if (!isDragging.current && currentWordIndex !== null) {
            setSliderValue([currentWordIndex]);
        }
    }, [currentWordIndex]);

    const handlePlayPause = () => {
        if (isPlaying) {
            pause();
        } else if (isPaused) {
            resume();
        } else {
            play(text);
        }
    };

    const handleStop = () => {
        stop();
        setSliderValue([0]);
    };

    const handleSliderChange = (vals: number[]) => {
        isDragging.current = true;
        setSliderValue(vals);
    };

    const handleSliderCommit = (vals: number[]) => {
        isDragging.current = false;
        seek(vals[0]);
    };

    // Calculate max value for slider
    const maxTokens = tokens.length > 0 ? tokens.length - 1 : 0;

    if (!text.trim()) return null;

    return (
        <div className={`w-full p-4 border-border/40 bg-background/95 backdrop-blur z-40 flex gap-4 ${vertical
            ? 'flex-col border rounded-xl shadow-sm'
            : 'flex-col border-b'
            }`}>
            <div className={`flex gap-4 items-center justify-between w-full ${vertical ? 'flex-col items-stretch' : 'flex-col md:flex-row'}`}>
                <div className={`flex items-center gap-2 ${vertical ? 'justify-between' : ''}`}>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-full"
                            onClick={handlePlayPause}
                        >
                            {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleStop}
                            disabled={!isPlaying && !isPaused}
                        >
                            <Square className="h-4 w-4 fill-current" />
                        </Button>
                    </div>

                    {!vertical && <div className="h-6 w-px bg-border/50 mx-2" />}

                    {vertical && <div className="flex-1" />}

                    <div className={`flex items-center gap-2 ${vertical ? 'flex-col items-end' : ''}`}>
                        {!vertical && <div className="text-xs font-medium text-muted-foreground mb-1.5 ml-1">Selection Mode</div>}
                        <Select
                            value={useReaderStore(state => state.selectionMode)}
                            onValueChange={(val) => useReaderStore.getState().setSelectionMode(val as SelectionMode)}
                        >
                            <SelectTrigger className={`bg-secondary/50 border-border/50 h-8 text-xs ${vertical ? 'w-[140px]' : 'w-full'}`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={SelectionMode.Word} className="text-xs">Word Selection</SelectItem>
                                <SelectItem value={SelectionMode.Sentence} className="text-xs">Sentence Selection</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className={`flex items-center gap-4 flex-1 w-full ${vertical ? 'flex-col items-stretch' : 'md:w-auto overflow-hidden'}`}>
                    <div className={`flex items-center gap-2 flex-1 ${vertical ? 'w-full' : 'min-w-[200px]'}`}>
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                        <Select
                            value={selectedVoice?.name || ""}
                            onValueChange={(val: string) => {
                                const voice = availableVoices.find(v => v.name === val);
                                if (voice) setVoice(voice);
                            }}
                        >
                            <SelectTrigger className="h-8 text-xs bg-secondary/50 border-0 w-full">
                                <SelectValue placeholder="Select Voice" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableVoices.map(voice => (
                                    <SelectItem key={voice.name} value={voice.name} className="text-xs">
                                        {voice.name} ({voice.lang})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className={`flex items-center gap-2 ${vertical ? 'w-full' : 'w-[120px]'}`}>
                        <span className="text-xs text-muted-foreground w-8">{playbackRate}x</span>
                        <Slider
                            defaultValue={[playbackRate]}
                            min={0.5}
                            max={2}
                            step={0.1}
                            onValueCommit={(vals: number[]) => setRate(vals[0])}
                            className="flex-1"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-2 w-full justify-between items-center">

                {/* Timeline Slider */}
                <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-muted-foreground w-10 text-right">
                        {sliderValue[0]}
                    </span>
                    <Slider
                        value={sliderValue}
                        min={0}
                        max={maxTokens}
                        step={1}
                        onValueChange={handleSliderChange}
                        onValueCommit={handleSliderCommit}
                        className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-10">
                        {maxTokens}
                    </span>
                </div>

                <div className="h-6 w-px bg-border/50 mx-2" />

                {/* Translation Controls */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={toggleShowTranslations}
                        title={showTranslations ? "Hide Translations" : "Show Translations"}
                    >
                        {showTranslations ?
                            <Eye className="h-4 w-4 text-muted-foreground" /> :
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                        }
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                            clearSelectionTranslations();
                            clearSelection();
                        }}
                        title="Clear All Translations"
                    >
                        <Eraser className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>

            </div>
        </div >
    );
};
