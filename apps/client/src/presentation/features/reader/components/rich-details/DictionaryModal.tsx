import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import { NativeDictionaryView } from './NativeDictionaryView';
import { BookA, BookOpen, Globe, Search } from "lucide-react";

export type TabType = 'oxford' | 'wiktionary' | 'freedict';

interface DictionaryModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    word: string;
    langCode: string;
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export function DictionaryModal({
    isOpen,
    onOpenChange,
    word,
    langCode,
    activeTab,
    onTabChange
}: DictionaryModalProps) {
    const cleanWord = word.trim();
    const encodedWord = encodeURIComponent(cleanWord);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-5xl h-[85vh] flex flex-col p-4 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden select-none">
                {/* Header */}
                <DialogHeader className="pb-3 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-3 relative">
                    <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                        <BookA className="h-5 w-5 text-primary" /> 
                        In-App Lookups: <span className="text-primary italic font-serif font-semibold">{cleanWord}</span>
                    </DialogTitle>

                    {/* Tabs Control - Right margin keeps it clear of the absolute close button */}
                    <div className="flex flex-wrap bg-muted/60 p-1 rounded-2xl md:rounded-full border border-border/50 max-w-2xl gap-1 mr-8 lg:mr-10">
                        <button
                            onClick={() => onTabChange('oxford')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
                                activeTab === 'oxford'
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <BookOpen className="h-3.5 w-3.5" />
                            Google Define (Oxford)
                        </button>
                        <button
                            onClick={() => onTabChange('wiktionary')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
                                activeTab === 'wiktionary'
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Globe className="h-3.5 w-3.5" />
                            Wiktionary
                        </button>
                        <button
                            onClick={() => onTabChange('freedict')}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all ${
                                activeTab === 'freedict'
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Search className="h-3.5 w-3.5" />
                            Free Dictionary
                        </button>
                    </div>

                </DialogHeader>

                {/* Content Container */}
                <div className="flex-1 mt-3 overflow-hidden bg-background relative flex flex-col">
                    {/* Tab 1: Google Define / Native Oxford */}
                    {activeTab === 'oxford' && (
                        <NativeDictionaryView word={cleanWord} langCode={langCode} />
                    )}

                    {/* Tab 2: Wiktionary Iframe */}
                    {activeTab === 'wiktionary' && (
                        <div className="flex-1 rounded-xl border overflow-hidden bg-background relative h-full">
                            <iframe
                                src={`https://${langCode}.m.wiktionary.org/wiki/${encodedWord}`}
                                className="w-full h-full border-none bg-background rounded-xl"
                                title="Wiktionary Definition"
                                sandbox="allow-scripts allow-same-origin allow-popups"
                                loading="lazy"
                            />
                        </div>
                    )}

                    {/* Tab 3: Free Dictionary Iframe */}
                    {activeTab === 'freedict' && (
                        <div className="flex-1 rounded-xl border overflow-hidden bg-background relative h-full">
                            <iframe
                                src={`https://${langCode === 'en' ? 'www' : langCode}.thefreedictionary.com/${encodedWord}`}
                                className="w-full h-full border-none bg-background rounded-xl"
                                title="Free Dictionary Definition"
                                sandbox="allow-scripts allow-same-origin allow-popups"
                                loading="lazy"
                            />
                        </div>
                    )}

                </div>
            </DialogContent>
        </Dialog>
    );
}
