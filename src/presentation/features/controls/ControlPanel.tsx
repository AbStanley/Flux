import React, { useState } from 'react';
import { useServices } from '../../contexts/ServiceContext';
import { Card, CardContent, CardHeader, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { LanguageSelect } from "../../components/LanguageSelect";
import { SOURCE_LANGUAGES, TARGET_LANGUAGES } from "../../../core/constants/languages";
import { LearningControls } from "./LearningControls";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { useReaderStore } from '../reader/store/useReaderStore';

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

    const abortControllerRef = React.useRef<AbortController | null>(null);

    // Learning Mode State
    const [isLearningMode, setIsLearningMode] = useState(true);
    const [proficiencyLevel, setProficiencyLevel] = useState("B1");
    const [topic, setTopic] = useState("");

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

    const handleGenerate = async () => {
        setIsGenerating(true);
        // Clear previous text to start fresh
        setText('');

        abortControllerRef.current = new AbortController();

        try {
            let prompt = "";
            if (isLearningMode) {
                const topicPhrase = topic ? ` about "${topic}"` : " about a random interesting topic";
                prompt = `Write a short story ${topicPhrase} in ${sourceLang} suitable for a ${proficiencyLevel} proficiency level learner. The vocabulary and grammar should be appropriate for ${proficiencyLevel}. Include a title starting with '## '. Output ONLY the title and the story text. Do not include any introductory or concluding remarks. Do NOT include translations.`;
            } else {
                prompt = `Write a short, interesting story in ${sourceLang} about a robot learning to paint. Include a title starting with '## '. Output ONLY the title and the story text. Do not include any introductory or concluding remarks. Do NOT include translations.`;
            }

            await aiService.generateText(prompt, {
                signal: abortControllerRef.current.signal,
                onProgress: (_chunk, fullText) => {
                    setText(fullText);
                }
            });
        } catch (error: any) {
            if (error.name === 'AbortError' || error.message === 'Aborted') {
                console.log('Generation aborted by user');
            } else {
                console.error(error);
                alert("Failed to generate text");
            }
        } finally {
            setIsGenerating(false);
            abortControllerRef.current = null;
        }
    };

    const handleStopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setText(content);
        };
        reader.readAsText(file);
    };

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
                <div className="flex flex-col sm:flex-row gap-2 pb-2 border-b border-border/40 items-stretch sm:items-end">
                    <LanguageSelect
                        label="Source Language"
                        value={sourceLang}
                        onChange={setSourceLang}
                        options={SOURCE_LANGUAGES}
                        placeholder="Select Source"
                        className="flex-1"
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
                        className="flex-1"
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

                    <Button variant="outline" className="relative w-full sm:w-auto cursor-pointer" disabled={isGenerating}>
                        Load File
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isGenerating}
                        />
                    </Button>

                    <Button
                        onClick={handleStartReading}
                        disabled={!text.trim() || isGenerating}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
                    >
                        Start Reading
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
