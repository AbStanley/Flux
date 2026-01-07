import React, { useEffect, useRef, useState } from 'react';
import { Slider } from "../../../../components/ui/slider";


interface TimelineControlProps {
    currentWordIndex: number | null;
    totalTokens: number;
    onSeek: (value: number) => void;
    vertical?: boolean;
}

export const TimelineControl: React.FC<TimelineControlProps> = ({
    currentWordIndex,
    totalTokens,
    onSeek,
    vertical = false
}) => {
    // Local state for smooth slider movement
    const [sliderValue, setSliderValue] = useState([0]);
    const isDragging = useRef(false);

    // Sync slider with playback only when not dragging
    useEffect(() => {
        if (!isDragging.current) {
            setSliderValue([currentWordIndex ?? 0]);
        }
    }, [currentWordIndex]);


    const handleSliderChange = (vals: number[]) => {
        isDragging.current = true;
        setSliderValue(vals);
    };

    const handleSliderCommit = (vals: number[]) => {
        isDragging.current = false;
        onSeek(vals[0]);
    };

    const maxTokens = Math.max(0, totalTokens - 1);

    if (vertical) {
        return (
            <div className="flex-1 w-2 h-20">
                <Slider
                    orientation="vertical"
                    value={sliderValue}
                    min={0}
                    max={maxTokens}
                    step={1}
                    onValueChange={handleSliderChange}
                    onValueCommit={handleSliderCommit}
                    className="h-full"
                />
            </div>
        );
    }

    return (
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
    );
};
