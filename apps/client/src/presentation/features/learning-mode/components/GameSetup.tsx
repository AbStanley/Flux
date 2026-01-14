import React, { useEffect, useState, useMemo } from 'react';
import { Button } from "@/presentation/components/ui/button";
import { Switch } from "@/presentation/components/ui/switch";
import { Label } from "@/presentation/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Settings2, ArrowRightLeft, Play, Database, BrainCircuit, Library } from 'lucide-react';
import { wordsApi } from '@/infrastructure/api/words';
import { useGameStore } from '../store/useGameStore';

export const GameSetup: React.FC = () => {
    const { config, updateConfig, startGame } = useGameStore();

    // Map of Language -> Connected Languages
    const [languageGraph, setLanguageGraph] = useState<Record<string, string[]>>({});
    const [allUniqueLangs, setAllUniqueLangs] = useState<string[]>([]);
    const [isLoadingLangs, setIsLoadingLangs] = useState(false);

    // Fetch languages on mount if source is DB
    useEffect(() => {
        const fetchLanguages = async () => {
            if (config.source === 'db' && allUniqueLangs.length === 0) {
                setIsLoadingLangs(true);
                try {
                    const result = await wordsApi.getAll({ take: 500 });
                    const graph: Record<string, Set<string>> = {};
                    const all = new Set<string>();

                    result.items.forEach(word => {
                        const s = word.sourceLanguage;
                        const t = word.targetLanguage;

                        // We map connections bidirectionally for the game setup
                        if (s && t) {
                            if (!graph[s]) graph[s] = new Set();
                            if (!graph[t]) graph[t] = new Set();

                            graph[s].add(t);
                            graph[t].add(s);

                            all.add(s);
                            all.add(t);
                        }
                    });

                    const finalGraph: Record<string, string[]> = {};
                    Object.keys(graph).forEach(key => {
                        finalGraph[key] = Array.from(graph[key]).sort();
                    });

                    setLanguageGraph(finalGraph);
                    setAllUniqueLangs(Array.from(all).sort());
                } catch (e) {
                    console.error("Failed to fetch languages", e);
                } finally {
                    setIsLoadingLangs(false);
                }
            }
        };
        fetchLanguages();
    }, [config.source, allUniqueLangs.length]);

    // Derived Available Lists
    const availableSourceLangs = useMemo(() => {
        if (config.targetLang === 'all') return allUniqueLangs;
        return languageGraph[config.targetLang] || [];
    }, [config.targetLang, allUniqueLangs, languageGraph]);

    const availableTargetLangs = useMemo(() => {
        if (config.sourceLang === 'all') return allUniqueLangs;
        return languageGraph[config.sourceLang] || [];
    }, [config.sourceLang, allUniqueLangs, languageGraph]);


    const swapLanguages = () => {
        updateConfig({
            sourceLang: config.targetLang,
            targetLang: config.sourceLang
        });
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            <div className="text-center mb-8 space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Training Arena</h1>
                <p className="text-muted-foreground text-lg">Select your training source and mode.</p>
            </div>

            <Card className="border-2 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings2 className="w-6 h-6" />
                        Session Configuration
                    </CardTitle>
                    <CardDescription>
                        Settings are automatically saved for your next session.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Source Selection Tabs */}
                    <Tabs
                        value={config.source}
                        onValueChange={(val: any) => updateConfig({ source: val })}
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="db" className="flex gap-2"><Database className="w-4 h-4" /> Saved Words</TabsTrigger>
                            <TabsTrigger value="anki" disabled className="flex gap-2"><Library className="w-4 h-4" /> Anki Decks <span className="text-xs ml-1 opacity-50">(Soon)</span></TabsTrigger>
                            <TabsTrigger value="ai" disabled className="flex gap-2"><BrainCircuit className="w-4 h-4" /> AI Gen <span className="text-xs ml-1 opacity-50">(Soon)</span></TabsTrigger>
                        </TabsList>

                        <TabsContent value="db" className="space-y-6">
                            {/* Language Selection Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                                <div className="space-y-2">
                                    <Label>Source Language (Question)</Label>
                                    <Select
                                        value={config.sourceLang}
                                        disabled={isLoadingLangs}
                                        onValueChange={(val) => {
                                            updateConfig({ sourceLang: val });
                                            // Validate Target
                                            if (val !== 'all') {
                                                const validTargets = languageGraph[val] || [];
                                                if (config.targetLang !== 'all' && !validTargets.includes(config.targetLang)) {
                                                    updateConfig({ targetLang: 'all' });
                                                }
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoadingLangs ? "Loading..." : "Select language"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Any Language</SelectItem>
                                            {availableSourceLangs.map(lang => (
                                                <SelectItem key={lang} value={lang} disabled={lang === config.targetLang} className="uppercase">
                                                    {lang}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex justify-center md:pb-2">
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="rounded-full shadow-sm"
                                        onClick={swapLanguages}
                                        title="Swap Languages"
                                    >
                                        <ArrowRightLeft className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <Label>Target Language (Answer)</Label>
                                    <Select
                                        value={config.targetLang}
                                        disabled={isLoadingLangs}
                                        onValueChange={(val) => {
                                            updateConfig({ targetLang: val });
                                            // Validate Source
                                            if (val !== 'all') {
                                                const validSources = languageGraph[val] || [];
                                                if (config.sourceLang !== 'all' && !validSources.includes(config.sourceLang)) {
                                                    updateConfig({ sourceLang: 'all' });
                                                }
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoadingLangs ? "Loading..." : "Select language"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Any Language</SelectItem>
                                            {availableTargetLangs.map(lang => (
                                                <SelectItem key={lang} value={lang} disabled={lang === config.sourceLang} className="uppercase">
                                                    {lang}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="grid md:grid-cols-2 gap-8 pt-4 border-t">
                        <div className="space-y-4">
                            <Label>Game Mode</Label>
                            <Select
                                value={config.mode}
                                onValueChange={(val: any) => updateConfig({ mode: val })}
                            >
                                <SelectTrigger className="h-12 text-lg">
                                    <SelectValue placeholder="Select Game Mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                    <SelectItem value="build-word">Word Builder</SelectItem>
                                    <SelectItem value="dictation">Audio Dictation</SelectItem>
                                    <SelectItem value="scramble">Sentence Scramble</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                                {config.mode === 'multiple-choice' && "Identify the correct translation from 4 options."}
                                {config.mode === 'build-word' && "Spell the answer using individual letters."}
                                {config.mode === 'dictation' && "Listen to the word and spell it out."}
                                {config.mode === 'scramble' && "Rearrange scrambled words to form the correct sentence."}
                            </p>
                        </div>

                        <div className="flex flex-col justify-start space-y-4">
                            <Label>Options</Label>
                            <div className="flex items-center justify-between space-x-2 border rounded-lg p-4 bg-muted/20">
                                <Label htmlFor="timer-mode" className="flex flex-col space-y-1 cursor-pointer">
                                    <span className="font-semibold">Speed Mode</span>
                                    <span className="font-normal text-xs text-muted-foreground">Enable 10s timer per question</span>
                                </Label>
                                <Switch
                                    id="timer-mode"
                                    checked={config.timerEnabled}
                                    onCheckedChange={(val) => updateConfig({ timerEnabled: val })}
                                />
                            </div>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="flex justify-center pb-8 pt-4">
                    <Button size="lg" className="w-full md:w-1/2 text-xl font-bold h-16 shadow-xl shadow-primary/20 hover:scale-105 transition-all" onClick={() => startGame()}>
                        <Play className="w-6 h-6 mr-3 fill-current" /> START GAME
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};
