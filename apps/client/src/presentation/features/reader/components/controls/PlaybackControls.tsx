import { Button } from "../../../../components/ui/button";

import { Play, Pause, Square } from "lucide-react";

interface PlaybackControlsProps {
    isPlaying: boolean;
    isPaused: boolean;
    onPlayPause: () => void;
    onStop: () => void;
    variant?: 'default' | 'mini';
}

export function PlaybackControls({
    isPlaying,
    isPaused,
    onPlayPause,
    onStop,
    variant = 'default'
}: PlaybackControlsProps) {
    const isMini = variant === 'mini';

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="icon"
                className={`${isMini ? 'h-8 w-8' : 'h-10 w-10'} rounded-full`}
                onClick={onPlayPause}
            >
                {isPlaying ? (
                    <Pause className={`${isMini ? 'h-4 w-4' : 'h-5 w-5'} fill-current`} />
                ) : (
                    <Play className={`${isMini ? 'h-4 w-4' : 'h-5 w-5'} fill-current ml-0.5`} />
                )}
            </Button>

            {!isMini && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onStop}
                    disabled={!isPlaying && !isPaused}
                >
                    <Square className="h-4 w-4 fill-current" />
                </Button>
            )}
        </div>
    );
};
