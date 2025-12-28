import React, { useState } from 'react';
import { useServices } from '../../contexts/ServiceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { LanguageSelect } from "../../components/LanguageSelect";
import { SOURCE_LANGUAGES, TARGET_LANGUAGES } from "../../../core/constants/languages";
import { LearningControls } from "./LearningControls";
import { ArrowRightLeft } from "lucide-react";

interface ControlPanelProps {
    onTextChange: (text: string) => void;
    sourceLang: string;
    targetLang: string;
    setSourceLang: (lang: string) => void;
    setTargetLang: (lang: string) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
    onTextChange,
    sourceLang,
    targetLang,
    setSourceLang,
    setTargetLang
}) => {
    const { aiService, setServiceType, currentServiceType } = useServices();
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    // Learning Mode State
    const [isLearningMode, setIsLearningMode] = useState(true);
    const [proficiencyLevel, setProficiencyLevel] = useState("B1");
    const [topic, setTopic] = useState("");

    React.useEffect(() => {
        if (currentServiceType === 'ollama') {
            aiService.getAvailableModels().then(models => {
                if (models.length > 0) setAvailableModels(models);
            });
        }
    }, [aiService, currentServiceType]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            let prompt = `Write a short, interesting story in ${sourceLang}. Output ONLY the story text. Do not include any introductory or concluding remarks. Do not include translations.`;

            if (isLearningMode) {
                const topicPhrase = topic ? ` about "${topic}"` : " about a random interesting topic";
                prompt = `Write a short story${topicPhrase} in ${sourceLang} suitable for a ${proficiencyLevel} proficiency level learner. The vocabulary and grammar should be appropriate for ${proficiencyLevel}. Output ONLY the story text.`;
            } else {
                prompt = `Write a short, interesting story in ${sourceLang} about a robot learning to paint. Output ONLY the story text.`;
            }

            const result = await aiService.generateText(prompt);
            setInputText(result);
            onTextChange(result);
        } catch (error) {
            console.error(error);
            alert("Failed to generate text");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setInputText(content);
            onTextChange(content);
        };
        reader.readAsText(file);
    };

    const handleManualChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value);
        onTextChange(e.target.value);
    };

    const handleSwapLanguages = () => {
        const temp = sourceLang;
        setSourceLang(targetLang);
        setTargetLang(temp);
    };

    return (
        <Card className="w-full mb-8 glass text-card-foreground">
            <CardHeader className="space-y-4">
                <div className="flex gap-4 pb-4 border-b border-border/40 items-end">
                    <LanguageSelect
                        label="Source Language"
                        value={sourceLang}
                        onChange={setSourceLang}
                        options={SOURCE_LANGUAGES}
                        placeholder="Select Source"
                        className="flex-1"
                    />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSwapLanguages}
                        className="mb-[2px] hover:bg-secondary/80"
                        title="Swap Languages"
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
                    />
                </div>

                <LearningControls
                    isLearningMode={isLearningMode}
                    setIsLearningMode={setIsLearningMode}
                    proficiencyLevel={proficiencyLevel}
                    setProficiencyLevel={setProficiencyLevel}
                    topic={topic}
                    setTopic={setTopic}
                />

                <div className="flex justify-between items-center pt-2">
                    <CardTitle className="text-xl">Reader Input</CardTitle>
                    <div className="flex gap-2">
                        {currentServiceType === 'ollama' && (
                            <Select
                                value={((aiService as any).model) || ""} // Type casting for now, ideally fix Interface
                                onValueChange={(val) => setServiceType('ollama', { model: val })}
                            >
                                <SelectTrigger className="w-[180px] bg-secondary/30 border-border/50">
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
                        >
                            <SelectTrigger className="w-[150px] bg-secondary/30 border-border/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mock">Mock AI</SelectItem>
                                <SelectItem value="ollama">Ollama (Local)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <CardDescription>
                    Enter text below or generate a story to practice reading.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <Textarea
                    placeholder="Paste text here, or generate..."
                    className="min-h-[160px] font-mono text-lg shadow-sm resize-none focus-visible:ring-primary bg-secondary/30 border-border/50"
                    value={inputText}
                    onChange={handleManualChange}
                />

                <div className="flex gap-4">
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full sm:w-auto"
                    >
                        {isGenerating ? 'Generating...' : 'Generate with AI'}
                    </Button>

                    <Button variant="outline" className="relative w-full sm:w-auto cursor-pointer">
                        Load File
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
