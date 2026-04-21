import { useState } from 'react';
import { useServices } from '../../contexts/ServiceContext';
import { Card, CardContent, CardHeader, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { LanguageSelect } from "../../components/LanguageSelect";
import { SOURCE_LANGUAGES, TARGET_LANGUAGES } from "../../../core/constants/languages";
import { LearningControls } from "./LearningControls";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { useReaderStore } from '../reader/store/useReaderStore';
import { useSettingsStore } from '../settings/store/useSettingsStore';

import { useStoryGeneration } from './hooks/useStoryGeneration';
import { FileImporter } from '../importer/FileImporter';
import { AIControls } from './AIControls';
import { ReaderInput } from './ReaderInput';
import { SessionLibrary } from '../reader/components/SessionLibrary';
import { cn } from "@/lib/utils";


export function ControlPanel() {
    const { aiService } = useServices();

    // Store State & Actions
    const text = useReaderStore(state => state.text);
    const setText = useReaderStore(state => state.setText);
    const sourceLang = useReaderStore(state => state.sourceLang);
    const setSourceLang = useReaderStore(state => state.setSourceLang);
    const targetLang = useReaderStore(state => state.targetLang);
    const setTargetLang = useReaderStore(state => state.setTargetLang);
    const setIsReading = useReaderStore(state => state.setIsReading);
    const isGenerating = useReaderStore(state => state.isGenerating);
    const setIsGenerating = useReaderStore(state => state.setIsGenerating);

    // Persistent Settings
    const proficiencyLevel = useSettingsStore(state => state.proficiencyLevel);
    const setProficiencyLevel = useSettingsStore(state => state.setProficiencyLevel);
    const contentType = useSettingsStore(state => state.contentType);
    const setContentType = useSettingsStore(state => state.setContentType);

    const [isImporterOpen, setIsImporterOpen] = useState(false);

    // Learning Mode State
    const [isLearningMode, setIsLearningMode] = useState(true);
    const [topic, setTopic] = useState("");


    const { generateStory, stopGeneration } = useStoryGeneration({
        aiService,
        setText,
        setIsGenerating,
        sourceLang,
        isLearningMode,
        topic,
        proficiencyLevel,
        contentType
    });

    const handleSwapLanguages = () => {
        if (isGenerating) return;
        const temp = sourceLang;
        setSourceLang(targetLang);
        setTargetLang(temp);
    };

    const handleStartReading = () => {
        if (text.trim()) {
            setIsReading(true);
        }
    };

    return (
        <Card className={cn("w-full mt-5 mb-2 glass text-card-foreground")}>
            <CardHeader className={cn("p-4 transition-all duration-500", isGenerating && "p-0")}>
                <div className={cn("grid transition-all duration-500 ease-in-out", isGenerating ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100")}>
                    <div className="overflow-hidden space-y-2">
                        <div className={cn("flex flex-col sm:flex-row gap-2 pb-2 border-b border-border/40 items-center sm:items-end justify-center")}>
                            <LanguageSelect
                                label="Foreign Language 🌍"
                                value={sourceLang}
                                onChange={setSourceLang}
                                options={SOURCE_LANGUAGES}
                                placeholder="Select Foreign"
                                className="w-full sm:w-[200px]"
                                disabled={isGenerating}
                            />

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSwapLanguages}
                                className={cn("mb-[2px] hover:bg-secondary/80")}
                                title="Swap Languages"
                                disabled={isGenerating}
                            >
                                <ArrowRightLeft className="h-4 w-4" />
                            </Button>

                            <LanguageSelect
                                label="Native Language 🏠"
                                value={targetLang}
                                onChange={setTargetLang}
                                options={TARGET_LANGUAGES}
                                placeholder="Select Native"
                                className="w-full sm:w-[200px]"
                                disabled={isGenerating}
                            />
                        </div>

                        <div className={cn(isGenerating ? 'opacity-50 pointer-events-none' : '')}>
                            <LearningControls
                                isLearningMode={isLearningMode}
                                setIsLearningMode={setIsLearningMode}
                                proficiencyLevel={proficiencyLevel}
                                setProficiencyLevel={setProficiencyLevel}
                                topic={topic}
                                setTopic={setTopic}
                                contentType={contentType}
                                setContentType={setContentType}
                            />
                        </div>

                        <AIControls isGenerating={isGenerating} />

                        <CardDescription className={cn("text-xs hidden sm:block")}>
                            Enter text below or generate a story to practice reading.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className={cn("space-y-2 p-4 pt-0 transition-all duration-500", isGenerating && "space-y-0")}>
                <div className={cn("grid transition-all duration-500 ease-in-out", isGenerating ? "grid-rows-[0fr] opacity-0 mb-0" : "grid-rows-[1fr] opacity-100 mb-2")}>
                    <div className="overflow-hidden">
                        <SessionLibrary />
                    </div>
                </div>

                <div className={cn("transition-all duration-500", isGenerating ? "mt-0" : "")}>
                    <ReaderInput
                        text={text}
                        isGenerating={isGenerating}
                        onChange={(e) => setText(e.target.value)}
                        onClear={() => setText('')}
                    />
                </div>

                <div className={cn("flex gap-4 flex-wrap transition-all duration-500", isGenerating ? "justify-center mt-4" : "mt-2")}>
                    {isGenerating ? (
                        <Button
                            onClick={stopGeneration}
                            variant="destructive"
                            className={cn("w-full sm:w-auto")}
                        >
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Stop Generating
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={generateStory}
                                className={cn("w-full sm:w-auto")}
                            >
                                Generate Story
                            </Button>

                            <Button
                                variant="outline"
                                className={cn("w-full sm:w-auto cursor-pointer")}
                                disabled={isGenerating}
                                onClick={() => setIsImporterOpen(true)}
                            >
                                Import File (PDF/EPUB)
                            </Button>

                            <Button
                                onClick={handleStartReading}
                                disabled={!text.trim() || isGenerating}
                                className={cn("w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all")}
                            >
                                Open Reading Mode
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
            <FileImporter open={isImporterOpen} onOpenChange={setIsImporterOpen} />
        </Card>
    );
}
