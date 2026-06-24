import { useState } from 'react';
import { Button } from "../../../../components/ui/button";
import { BookA } from "lucide-react";
import { DictionaryModal, type TabType } from './DictionaryModal';

interface DictionariesSectionProps {
    word: string;
    langCode: string;
}

export function DictionariesSection({ word, langCode }: DictionariesSectionProps) {
    const [isDictOpen, setIsDictOpen] = useState(false);
    const [dictTab, setDictTab] = useState<TabType>('oxford');

    const openDictionary = (tabName: TabType) => {
        setDictTab(tabName);
        setIsDictOpen(true);
    };

    return (
        <>
            <div className="bg-muted/30 border border-border/60 rounded-xl p-3.5 mt-3 space-y-3 shadow-sm hover:shadow-md transition-all">
                <div className="space-y-0.5">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <BookA className="h-3.5 w-3.5 text-primary" /> Dictionaries
                    </p>
                    <p className="text-xs text-muted-foreground/80 leading-normal">
                        Select an option to look up the word in-app:
                    </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {langCode === 'en' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDictionary('oxford')}
                            className="text-xs font-semibold border-border/80 hover:bg-muted bg-card text-foreground/80 hover:text-foreground rounded-full h-8 px-3.5 transition-all"
                        >
                            Google Define 🔍
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDictionary('wiktionary')}
                        className="text-xs font-semibold border-border/80 hover:bg-muted bg-card text-foreground/80 hover:text-foreground rounded-full h-8 px-3.5 transition-all"
                    >
                        Wiktionary 📖
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDictionary('freedict')}
                        className="text-xs font-semibold border-border/80 hover:bg-muted bg-card text-foreground/80 hover:text-foreground rounded-full h-8 px-3.5 transition-all"
                    >
                        Free Dictionary 🌐
                    </Button>
                </div>
            </div>

            <DictionaryModal
                isOpen={isDictOpen}
                onOpenChange={setIsDictOpen}
                word={word}
                langCode={langCode}
                activeTab={dictTab}
                onTabChange={setDictTab}
            />
        </>
    );
}
