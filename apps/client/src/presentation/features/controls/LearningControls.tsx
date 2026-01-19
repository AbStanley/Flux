import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { LanguageSelect } from "../../components/LanguageSelect";
import { PROFICIENCY_LEVELS } from "../../../core/constants/levels";
import { cn } from "@/lib/utils";
import type { ContentType } from "../../../infrastructure/ai/prompts/GenerationPrompts";

interface LearningControlsProps {
    isLearningMode: boolean;
    setIsLearningMode: (value: boolean) => void;
    proficiencyLevel: string;
    setProficiencyLevel: (value: string) => void;
    topic: string;
    setTopic: (value: string) => void;
    contentType: ContentType;
    setContentType: (value: ContentType) => void;
}

const CONTENT_TYPES: { label: string; value: ContentType }[] = [
    { label: "Story", value: "Story" },
    { label: "Monologue", value: "Monologue" },
    { label: "Conversation", value: "Conversation" },
];

export function LearningControls({
    isLearningMode,
    setIsLearningMode,
    proficiencyLevel,
    setProficiencyLevel,
    topic,
    setTopic,
    contentType,
    setContentType
}: LearningControlsProps) {
    return (
        <div className={cn("space-y-2 pt-2 border-t border-white/10")}>
            <div className={cn("flex items-center space-x-2")}>
                <Switch
                    id="learning-mode"
                    checked={isLearningMode}
                    onCheckedChange={setIsLearningMode}
                />
                <Label htmlFor="learning-mode" className={cn("cursor-pointer text-sm")}>Enable Learning Mode</Label>
            </div>

            {isLearningMode && (
                <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2 duration-200")}>
                    <LanguageSelect
                        label="Content Type"
                        value={contentType}
                        onChange={(val) => setContentType(val as ContentType)}
                        options={CONTENT_TYPES}
                        placeholder="Select Type"
                    />

                    <LanguageSelect
                        label="Proficiency Level"
                        value={proficiencyLevel}
                        onChange={setProficiencyLevel}
                        options={PROFICIENCY_LEVELS}
                        placeholder="Select Level"
                    />
                    <div className={cn("flex flex-col gap-2")}>
                        <Label className={cn("uppercase text-xs text-muted-foreground tracking-wider")}>Topic (Optional)</Label>
                        <Input
                            placeholder="e.g. Travel, Cooking"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className={cn("bg-background")}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
