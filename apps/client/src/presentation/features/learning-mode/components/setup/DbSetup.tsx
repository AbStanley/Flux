import { useEffect, useState, useMemo } from 'react';
import { Button } from "@/presentation/components/ui/button";
import { ArrowRightLeft } from 'lucide-react';
import { wordsApi } from '@/infrastructure/api/words';
import { useGameStore } from '../../store/useGameStore';
import { LanguageSelector } from './LanguageSelector';

export function DbSetup() {
    const { config, updateConfig } = useGameStore();

    // Map of Language -> Connected Languages
    const [languageGraph, setLanguageGraph] = useState<Record<string, string[]>>({});
    const [allUniqueLangs, setAllUniqueLangs] = useState<string[]>([]);
    const [isLoadingLangs, setIsLoadingLangs] = useState(false);

    // Fetch languages on mount
    useEffect(() => {
        const fetchLanguages = async () => {
            if (allUniqueLangs.length === 0) {
                setIsLoadingLangs(true);
                try {
                    const result = await wordsApi.getAll({ take: 500 });
                    const graph: Record<string, Set<string>> = {};
                    const all = new Set<string>();

                    result.items.forEach(word => {
                        const s = word.sourceLanguage;
                        const t = word.targetLanguage;

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
    }, [allUniqueLangs.length]);

    // Derived Available Lists
    const availableSourceLangs = useMemo(() => {
        if (config.targetLang === 'all') return allUniqueLangs;
        return languageGraph[config.targetLang] || [];
    }, [config.targetLang, allUniqueLangs, languageGraph]);

    const availableTargetLangs = useMemo(() => {
        if (config.sourceLang === 'all') return allUniqueLangs;
        return languageGraph[config.sourceLang] || [];
    }, [config.sourceLang, allUniqueLangs, languageGraph]);

    // Auto-select first source language if currently 'all'
    useEffect(() => {
        if (allUniqueLangs.length > 0 && config.sourceLang === 'all') {
            updateConfig({ sourceLang: allUniqueLangs[0] });
        }
    }, [allUniqueLangs, config.sourceLang, updateConfig]);

    // Auto-select first target language if currently 'all' or invalid
    useEffect(() => {
        if (availableTargetLangs.length > 0 && (config.targetLang === 'all' || !availableTargetLangs.includes(config.targetLang))) {
            updateConfig({ targetLang: availableTargetLangs[0] });
        }
    }, [availableTargetLangs, config.targetLang, updateConfig]);

    const swapLanguages = () => {
        updateConfig({
            sourceLang: config.targetLang,
            targetLang: config.sourceLang
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end animate-in fade-in slide-in-from-top-2">
            <LanguageSelector
                label="Foreign Language 🌍"
                value={config.sourceLang}
                onChange={(val) => {
                    updateConfig({ sourceLang: val });
                    // Validate Target
                    if (val !== 'all') {
                        const validTargets = languageGraph[val] || [];
                        if (config.targetLang !== 'all' && !validTargets.includes(config.targetLang)) {
                            updateConfig({ targetLang: 'all' });
                        }
                    }
                }}
                disabled={isLoadingLangs}
                exclude={config.targetLang === 'all' ? undefined : config.targetLang}
                options={availableSourceLangs}
            />

            <div className="flex justify-center md:pb-2">
                <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full shadow-sm hover:scale-110 transition-transform"
                    onClick={swapLanguages}
                    title="Swap Languages"
                >
                    <ArrowRightLeft className="w-4 h-4" />
                </Button>
            </div>

            <LanguageSelector
                label="Native Language 🏠"
                value={config.targetLang}
                onChange={(val) => {
                    updateConfig({ targetLang: val });
                    // Validate Source
                    if (val !== 'all') {
                        const validSources = languageGraph[val] || [];
                        if (config.sourceLang !== 'all' && !validSources.includes(config.sourceLang)) {
                            updateConfig({ sourceLang: 'all' });
                        }
                    }
                }}
                disabled={isLoadingLangs}
                exclude={config.sourceLang === 'all' ? undefined : config.sourceLang}
                options={availableTargetLangs}
            />
        </div>
    );
};
