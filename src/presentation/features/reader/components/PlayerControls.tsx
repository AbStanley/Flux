import React, { useEffect } from 'react';
import { Button } from "../../../components/ui/button";
import { Slider } from "../../../components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Play, Pause, Square, Volume2 } from "lucide-react";
import { useAudioStore } from '../store/useAudioStore';
import { useReaderStore } from '../store/useReaderStore';
import { SelectionMode } from '../../../../core/types';

export const PlayerControls: React.FC = () => {
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

    const { text, tokens: readerTokens } = useReaderStore();

    // Local state for smooth slider movement
    const [sliderValue, setSliderValue] = React.useState([0]);
    const isDragging = React.useRef(false);

    useEffect(() => {
        init();
    }, [init]);

    // Sync tokens
    useEffect(() => {
        setTokens(readerTokens);
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
        <div className="w-full p-4 border-b border-border/40 bg-background/95 backdrop-blur z-40 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
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

                    <div className="h-6 w-px bg-border/50 mx-2" />

                    <div className="text-xs font-medium text-muted-foreground mb-1.5 ml-1">Selection Mode</div>
                    <Select
                        value={useReaderStore(state => state.selectionMode)}
                        onValueChange={(val) => useReaderStore.getState().setSelectionMode(val as SelectionMode)}
                    >
                        <SelectTrigger className="w-full bg-secondary/50 border-border/50 h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={SelectionMode.Word} className="text-xs">Word Selection</SelectItem>
                            <SelectItem value={SelectionMode.Sentence} className="text-xs">Sentence Selection</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-4 flex-1 w-full md:w-auto overflow-hidden">
                    <div className="flex items-center gap-2 min-w-[200px] flex-1">
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                        <Select
                            value={selectedVoice?.name || ""}
                            onValueChange={(val: string) => {
                                const voice = availableVoices.find(v => v.name === val);
                                if (voice) setVoice(voice);
                            }}
                        >
                            <SelectTrigger className="h-8 text-xs bg-secondary/50 border-0">
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

                    <div className="flex items-center gap-2 w-[120px]">
                        <span className="text-xs text-muted-foreground w-8">{playbackRate}x</span>
                        <Slider
                            value={[playbackRate]}
                            min={0.5}
                            max={2}
                            step={0.1}
                            onValueChange={(vals: number[]) => setRate(vals[0])}
                            className="flex-1"
                        />
                    </div>
                </div>
            </div>

            {/* Timeline Slider */}
            <div className="w-full flex items-center gap-2">
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
        </div>
    );
};
