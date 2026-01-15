import { Button } from "@/presentation/components/ui/button";
import { Switch } from "@/presentation/components/ui/switch";
import { Label } from "@/presentation/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Settings2, Play, Database, BrainCircuit, Library } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { DbSetup } from './setup/DbSetup';
import { AnkiSetup } from './setup/AnkiSetup';

export function GameSetup() {
    const { config, updateConfig, startGame, error } = useGameStore();

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
                        onValueChange={(val: any) => updateConfig({
                            source: val,
                            // Reset languages when switching sources to prevent invalid states
                            sourceLang: 'all',
                            targetLang: 'all'
                        })}
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="db" className="flex gap-2"><Database className="w-4 h-4" /> Saved Words</TabsTrigger>
                            <TabsTrigger value="anki" className="flex gap-2"><Library className="w-4 h-4" /> Anki Decks</TabsTrigger>
                            <TabsTrigger value="ai" disabled className="flex gap-2"><BrainCircuit className="w-4 h-4" /> AI Gen <span className="text-xs ml-1 opacity-50">(Soon)</span></TabsTrigger>
                        </TabsList>

                        {error && (
                            <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                                <span className="font-medium">Error!</span> {error}
                            </div>
                        )}

                        <TabsContent value="db" className="space-y-6">
                            <DbSetup />
                        </TabsContent>

                        <TabsContent value="anki" className="space-y-6">
                            <AnkiSetup />
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
            </Card >
        </div >
    );
};
