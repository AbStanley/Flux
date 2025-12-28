import React from 'react';
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { LanguageSelect } from "../../components/LanguageSelect";
import { PROFICIENCY_LEVELS } from "../../../core/constants/levels";

interface LearningControlsProps {
    isLearningMode: boolean;
    setIsLearningMode: (value: boolean) => void;
    proficiencyLevel: string;
    setProficiencyLevel: (value: string) => void;
    topic: string;
    setTopic: (value: string) => void;
}

export const LearningControls: React.FC<LearningControlsProps> = ({
    isLearningMode,
    setIsLearningMode,
    proficiencyLevel,
    setProficiencyLevel,
    topic,
    setTopic
}) => {
    return (
        <div className="space-y-4 pt-2 border-t border-white/10">
            <div className="flex items-center space-x-2">
                <Switch
                    id="learning-mode"
                    checked={isLearningMode}
                    onCheckedChange={setIsLearningMode}
                />
                <Label htmlFor="learning-mode" className="cursor-pointer">Enable Learning Mode</Label>
            </div>

            {isLearningMode && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <LanguageSelect
                        label="Proficiency Level"
                        value={proficiencyLevel}
                        onChange={setProficiencyLevel}
                        options={PROFICIENCY_LEVELS}
                        placeholder="Select Level"
                    />
                    <div className="flex flex-col gap-2">
                        <Label className="uppercase text-xs text-muted-foreground tracking-wider">Topic (Optional)</Label>
                        <Input
                            placeholder="e.g. Travel, Cooking, Sci-Fi"
                            value={topic}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
                            className="bg-background"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
