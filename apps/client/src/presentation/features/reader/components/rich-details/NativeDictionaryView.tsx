import { useEffect, useState } from 'react';
import { Button } from "../../../../components/ui/button";
import { Skeleton } from "../../../../components/ui/skeleton";
import { Volume2, BookOpen, AlertCircle } from "lucide-react";

interface Phonetic {
    text?: string;
    audio?: string;
}

interface Definition {
    definition: string;
    example?: string;
    synonyms: string[];
    antonyms: string[];
}

interface Meaning {
    partOfSpeech: string;
    definitions: Definition[];
}

interface DictionaryEntry {
    word: string;
    phonetic?: string;
    phonetics: Phonetic[];
    meanings: Meaning[];
}

interface NativeDictionaryViewProps {
    word: string;
    langCode: string;
}

export function NativeDictionaryView({ word, langCode }: NativeDictionaryViewProps) {
    const cleanWord = word.trim();
    const isUnsupportedLang = langCode !== 'en';

    const [data, setData] = useState<DictionaryEntry | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [prevWord, setPrevWord] = useState(cleanWord);

    // Adjust state during rendering when the word changes (React's official best-practice)
    if (cleanWord !== prevWord) {
        setPrevWord(cleanWord);
        setLoading(true);
        setFetchError(null);
        setData(null);
    }

    useEffect(() => {
        if (!cleanWord || isUnsupportedLang) return;

        let active = true;

        fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`)
            .then(res => {
                if (!res.ok) {
                    if (res.status === 404) {
                        throw new Error(`No native definition found for "${cleanWord}".`);
                    }
                    throw new Error("Failed to fetch dictionary definition.");
                }
                return res.json();
            })
            .then((resData: DictionaryEntry[]) => {
                if (active) {
                    if (resData && resData[0]) {
                        setData(resData[0]);
                    } else {
                        throw new Error("No data returned from dictionary API.");
                    }
                }
            })
            .catch(err => {
                if (active) {
                    setFetchError(err instanceof Error ? err.message : "An error occurred");
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [cleanWord, isUnsupportedLang]);

    const error = isUnsupportedLang
        ? "Native Oxford definitions are optimized for English. For foreign languages, please use the Wiktionary or AI Explanation tabs."
        : fetchError;

    const playAudio = () => {
        if (!data) return;
        const audioEntry = data.phonetics.find(p => p.audio && p.audio.length > 0);
        if (audioEntry?.audio) {
            let url = audioEntry.audio;
            if (url.startsWith('//')) {
                url = 'https:' + url;
            }
            const audio = new Audio(url);
            audio.play().catch(e => console.error("Error playing audio:", e));
        }
    };

    const hasAudio = data?.phonetics.some(p => p.audio && p.audio.length > 0);

    if (loading) {
        return (
            <div className="space-y-4 p-2 animate-pulse">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="space-y-3 bg-muted/30 p-4 rounded-xl border">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-xl bg-muted/20">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground mb-1">{error}</p>
                {langCode !== 'en' && (
                    <p className="text-xs text-muted-foreground max-w-xs mt-1">
                        Use the tabs above to access Wiktionary or generate a high-fidelity AI Deep Explanation in the source language.
                    </p>
                )}
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-5 p-2 overflow-y-auto max-h-[70vh] pr-3 select-text">
            {/* Header section with Word & Phonetics */}
            <div className="flex flex-wrap items-center gap-3 border-b pb-3">
                <h3 className="text-2xl font-bold text-foreground">{data.word}</h3>
                {data.phonetic && (
                    <span className="text-sm font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                        {data.phonetic}
                    </span>
                )}
                {hasAudio && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={playAudio}
                        className="h-8 w-8 rounded-full border-primary/20 text-primary hover:bg-primary/10 hover:text-primary transition-all"
                        title="Listen to Pronunciation"
                    >
                        <Volume2 className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Meanings & Definitions */}
            <div className="space-y-4">
                {data.meanings.map((meaning, mIdx) => (
                    <div key={mIdx} className="bg-muted/40 border rounded-xl p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 border-b border-border/50 pb-1.5">
                            <BookOpen className="h-4 w-4 text-primary/80" />
                            <span className="text-xs font-bold uppercase tracking-wider text-primary">
                                {meaning.partOfSpeech}
                            </span>
                        </div>

                        <ul className="space-y-3 divide-y divide-border/30">
                            {meaning.definitions.map((def, dIdx) => (
                                <div key={dIdx} className={`${dIdx > 0 ? 'pt-3' : ''} space-y-1.5`}>
                                    <div className="flex gap-2">
                                        <span className="text-xs font-semibold text-muted-foreground mt-0.5">{dIdx + 1}.</span>
                                        <p className="text-sm text-foreground leading-relaxed font-medium">
                                            {def.definition}
                                        </p>
                                    </div>
                                    {def.example && (
                                        <p className="text-xs text-muted-foreground italic pl-5 border-l-2 border-primary/20 bg-primary/5 py-1 pr-2 rounded-r">
                                            "{def.example}"
                                        </p>
                                    )}
                                    {def.synonyms.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1.5 pl-5 text-xs">
                                            <span className="text-muted-foreground font-semibold">Synonyms:</span>
                                            {def.synonyms.slice(0, 4).map((syn, sIdx) => (
                                                <span key={sIdx} className="bg-muted px-2 py-0.5 rounded text-foreground border border-border/40">
                                                    {syn}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
