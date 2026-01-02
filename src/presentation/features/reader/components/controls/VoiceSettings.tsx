import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Slider } from "../../../../components/ui/slider";

import { Volume2 } from "lucide-react";

interface VoiceSettingsProps {
    selectedVoiceName: string | undefined;
    availableVoices: { name: string; lang: string }[];
    playbackRate: number;
    onVoiceChange: (voiceName: string) => void;
    onRateChange: (rate: number) => void;
    vertical?: boolean;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
    selectedVoiceName,
    availableVoices,
    playbackRate,
    onVoiceChange,
    onRateChange,
    vertical = false
}) => {
    return (
        <div className={`flex items-center gap-4 flex-1 w-full ${vertical ? 'flex-col items-stretch' : 'md:w-auto overflow-hidden'}`}>
            <div className={`flex items-center gap-2 flex-1 ${vertical ? 'w-full' : 'min-w-[200px]'}`}>
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Select
                    value={selectedVoiceName || ""}
                    onValueChange={onVoiceChange}
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
                    onValueCommit={(vals: number[]) => onRateChange(vals[0])}
                    className="flex-1"
                />
            </div>
        </div>
    );
};
