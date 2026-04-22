import { useMemo } from 'react';
import { Button } from "@/presentation/components/ui/button";
import { ArrowRightLeft } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { LanguageSelector } from './LanguageSelector';

export function DbSetup() {
    const { config, updateConfig, availableLangs, languageGraph, isLoadingLangs } = useGameStore();

    // Derived Available Lists
    const availableSourceLangs = useMemo(() => {
        if (config.targetLang === 'all') return availableLangs;
        return languageGraph[config.targetLang] || [];
    }, [config.targetLang, availableLangs, languageGraph]);

    const availableTargetLangs = useMemo(() => {
        if (config.sourceLang === 'all') return availableLangs;
        return languageGraph[config.sourceLang] || [];
    }, [config.sourceLang, availableLangs, languageGraph]);

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
