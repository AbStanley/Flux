import React, { useEffect, useState } from 'react';
import { Button } from "@/presentation/components/ui/button";
import { Label } from "@/presentation/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { ArrowRightLeft } from 'lucide-react';
import { ankiService } from '@/infrastructure/external/anki/AnkiService';
import { useGameStore } from '../../store/useGameStore';
import { LanguageSelector } from './LanguageSelector';

export const AnkiSetup: React.FC = () => {
    const { config, updateConfig } = useGameStore();

    // Anki State
    const [ankiDecks, setAnkiDecks] = useState<string[]>([]);
    const [ankiFields, setAnkiFields] = useState<string[]>([]);
    const [isLoadingAnki, setIsLoadingAnki] = useState(false);
    const [ankiError, setAnkiError] = useState<string | null>(null);

    // Fetch Decks
    useEffect(() => {
        const fetchDecks = async () => {
            if (ankiDecks.length === 0) {
                setIsLoadingAnki(true);
                setAnkiError(null);
                try {
                    const deckNames = await ankiService.getDeckNames();
                    setAnkiDecks(deckNames);
                } catch (e) {
                    setAnkiError("Could not connect to Anki. Please ensure Anki is running with AnkiConnect installed.");
                } finally {
                    setIsLoadingAnki(false);
                }
            }
        };
        fetchDecks();
    }, [ankiDecks.length]);

    // Fetch Fields when Deck Changes
    useEffect(() => {
        const fetchFields = async () => {
            if (config.ankiDeckName) {
                try {
                    const ids = await ankiService.findCards(`deck:"${config.ankiDeckName}"`);
                    if (ids.length > 0) {
                        const info = await ankiService.getCardsInfo([ids[0]]); // Get first card
                        if (info.length > 0) {
                            const fields = Object.keys(info[0].fields);
                            setAnkiFields(fields);

                            // Auto-select if not set
                            if (!config.ankiFieldSource && fields.length > 0) {
                                updateConfig({ ankiFieldSource: fields[0] });
                            }
                            if (!config.ankiFieldTarget && fields.length > 0) {
                                updateConfig({ ankiFieldTarget: fields[1] || fields[0] });
                            }
                        }
                    } else {
                        setAnkiFields([]);
                    }
                } catch (e) {
                    console.error("Failed to fetch fields for deck", e);
                }
            }
        };
        fetchFields();
    }, [config.ankiDeckName]);

    const swapAnkiConfig = () => {
        updateConfig({
            ankiFieldSource: config.ankiFieldTarget,
            ankiFieldTarget: config.ankiFieldSource,
            sourceLang: config.targetLang,
            targetLang: config.sourceLang
        });
    };

    if (ankiError) {
        return (
            <div className="space-y-4 text-destructive animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg flex items-start gap-4">
                    <div className="flex-1 space-y-1">
                        <p className="font-semibold text-lg flex items-center gap-2">Connection Failed</p>
                        <p className="text-sm opacity-90">{ankiError}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()} >Retry</Button>
                </div>
                <div className="p-4 rounded-lg bg-muted text-foreground text-sm space-y-2">
                    <p className="font-semibold">Troubleshooting:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Ensure <strong>Anki</strong> is open and running.</li>
                        <li>Ensure <strong>AnkiConnect</strong> add-on is installed (Code: 2055492159).</li>
                        <li>
                            Go to Anki &rarr; Tools &rarr; Add-ons &rarr; AnkiConnect &rarr; Config and ensure <code>webBindAddress</code> is <code>"0.0.0.0"</code> or <code>"127.0.0.1"</code>.
                        </li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-6 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-2">
                <Label>Select Deck</Label>
                <Select
                    value={config.ankiDeckName}
                    onValueChange={(val) => updateConfig({ ankiDeckName: val })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={isLoadingAnki ? "Loading decks..." : "Choose an Anki Deck"} />
                    </SelectTrigger>
                    <SelectContent>
                        {ankiDecks.map(deck => (
                            <SelectItem key={deck} value={deck}>{deck}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Make sure the deck contains cards with text.</p>
            </div>

            {config.ankiDeckName && ankiFields.length > 0 && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-2"
                            onClick={swapAnkiConfig}
                        >
                            <ArrowRightLeft className="w-3 h-3" />
                            Swap Front/Back
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Front Field (Question)</Label>
                            <Select
                                value={config.ankiFieldSource}
                                onValueChange={(val) => updateConfig({ ankiFieldSource: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Field" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ankiFields.map(field => (
                                        <SelectItem key={field} value={field}>{field}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <LanguageSelector
                            label="Front Language"
                            value={config.sourceLang}
                            onChange={(val) => updateConfig({ sourceLang: val })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Back Field (Answer)</Label>
                            <Select
                                value={config.ankiFieldTarget}
                                onValueChange={(val) => updateConfig({ ankiFieldTarget: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Field" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ankiFields.map(field => (
                                        <SelectItem key={field} value={field}>{field}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <LanguageSelector
                            label="Back Language"
                            value={config.targetLang}
                            onChange={(val) => updateConfig({ targetLang: val })}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
