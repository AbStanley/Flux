import React, { useState } from 'react';
import { useServices } from '../../contexts/ServiceContext';
import { Card, CardContent, CardHeader, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { LanguageSelect } from "../../components/LanguageSelect";
import { SOURCE_LANGUAGES, TARGET_LANGUAGES } from "../../../core/constants/languages";
import { LearningControls } from "./LearningControls";
import { ArrowRightLeft, Loader2, X } from "lucide-react";
import { useReaderStore } from '../reader/store/useReaderStore';
import { useStoryGeneration } from './hooks/useStoryGeneration';
import { FileImporter } from '../importer/FileImporter';


export const ControlPanel: React.FC = () => {
    const { aiService, setServiceType, currentServiceType } = useServices();

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

    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isImporterOpen, setIsImporterOpen] = useState(false);

    // Learning Mode State
    const [isLearningMode, setIsLearningMode] = useState(true);
    const [proficiencyLevel, setProficiencyLevel] = useState("B1");
    const [topic, setTopic] = useState("");

    const { generateStory, stopGeneration } = useStoryGeneration({
        aiService,
        setText,
        setIsGenerating,
        sourceLang,
        isLearningMode,
        topic,
        proficiencyLevel
    });

    React.useEffect(() => {
        if (currentServiceType === 'ollama') {
            aiService.getAvailableModels().then(models => {
                if (models.length > 0) {
                    setAvailableModels(models);

                    // Validate current model exists in available models
                    const currentModel = (aiService as any).model;
                    const isValidModel = models.includes(currentModel);

                    if (!currentModel || !isValidModel) {
                        // Default to the first available model
                        setServiceType('ollama', { model: models[1] });
                    }
                }
            });
        }
    }, [aiService, currentServiceType]);

    const handleGenerate = generateStory;
    const handleStopGeneration = stopGeneration;



    const handleManualChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

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
        <Card className="w-full mb-2 glass text-card-foreground">
            <CardHeader className="space-y-2 p-4">
                <div className="flex flex-col sm:flex-row gap-2 pb-2 border-b border-border/40 items-center sm:items-end justify-center">
                    <LanguageSelect
                        label="Source Language"
                        value={sourceLang}
                        onChange={setSourceLang}
                        options={SOURCE_LANGUAGES}
                        placeholder="Select Source"
                        className="w-full sm:w-[200px]"
                        disabled={isGenerating}
                    />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSwapLanguages}
                        className="mb-[2px] hover:bg-secondary/80"
                        title="Swap Languages"
                        disabled={isGenerating}
                    >
                        <ArrowRightLeft className="h-4 w-4" />
                    </Button>

                    <LanguageSelect
                        label="Target Language"
                        value={targetLang}
                        onChange={setTargetLang}
                        options={TARGET_LANGUAGES}
                        placeholder="Select Target"
                        className="w-full sm:w-[200px]"
                        disabled={isGenerating}
                    />
                </div>

                <div className={isGenerating ? 'opacity-50 pointer-events-none' : ''}>
                    <LearningControls
                        isLearningMode={isLearningMode}
                        setIsLearningMode={setIsLearningMode}
                        proficiencyLevel={proficiencyLevel}
                        setProficiencyLevel={setProficiencyLevel}
                        topic={topic}
                        setTopic={setTopic}
                    />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-1 gap-2">
                    <span className="uppercase text-xs text-muted-foreground tracking-wider font-semibold">Reader Input</span>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {currentServiceType === 'ollama' && (
                            <Select
                                value={((aiService as any).model) || ""} // Type casting for now, ideally fix Interface
                                onValueChange={(val) => setServiceType('ollama', { model: val })}
                                disabled={isGenerating}
                            >
                                <SelectTrigger className="w-full sm:w-[180px] bg-secondary/30 border-border/50 h-8 sm:h-10 text-xs sm:text-sm">
                                    <SelectValue placeholder="Select Model" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableModels.length > 0 ? (
                                        availableModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)
                                    ) : (
                                        <>
                                            <SelectItem value="llama2">llama2 (Default)</SelectItem>
                                            <SelectItem value="mistral">mistral</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                        <Select
                            value={currentServiceType}
                            onValueChange={(val) => setServiceType(val as 'mock' | 'ollama')}
                            disabled={isGenerating}
                        >
                            <SelectTrigger className="w-full sm:w-[150px] bg-secondary/30 border-border/50 h-8 sm:h-10 text-xs sm:text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mock">Mock AI</SelectItem>
                                <SelectItem value="ollama">Ollama (Local)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <CardDescription className="text-xs hidden sm:block">
                    Enter text below or generate a story to practice reading.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2 p-4 pt-0">
                <div className="relative">
                    <Textarea
                        placeholder="Paste text here, or generate..."
                        className={`min-h-[100px] font-mono text-base shadow-sm resize-none focus-visible:ring-primary bg-secondary/30 border-border/50 ${isGenerating ? 'overflow-hidden select-none' : ''}`}
                        value={text}
                        onChange={handleManualChange}
                        disabled={isGenerating}
                    />

                    {text && !isGenerating && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground bg-background/50 hover:bg-background/80 backdrop-blur-sm"
                            onClick={() => setText('')}
                            title="Clear text"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}

                    {isGenerating && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/10 backdrop-blur-[2px] rounded-md transition-all duration-500">
                            <div className="flex items-center gap-3 p-4 bg-background/60 rounded-xl shadow-xl border border-primary/10 backdrop-blur-md animate-pulse">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <span className="text-sm font-semibold tracking-wide text-primary">Creating Story...</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-4 flex-wrap">
                    {isGenerating ? (
                        <Button
                            onClick={handleStopGeneration}
                            variant="destructive"
                            className="w-full sm:w-auto"
                        >
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Stop Generating
                        </Button>
                    ) : (
                        <Button
                            onClick={handleGenerate}
                            className="w-full sm:w-auto"
                        >
                            Generate Story
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        className="w-full sm:w-auto cursor-pointer"
                        disabled={isGenerating}
                        onClick={() => setIsImporterOpen(true)}
                    >
                        Import File (PDF/EPUB)
                    </Button>

                    <Button
                        onClick={handleStartReading}
                        disabled={!text.trim() || isGenerating}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
                    >
                        Open Reading Mode
                    </Button>
                </div>
            </CardContent>
            <FileImporter open={isImporterOpen} onOpenChange={setIsImporterOpen} />
        </Card>
    );
};
