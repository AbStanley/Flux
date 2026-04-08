import { useState } from 'react';
import { Button } from '@/presentation/components/ui/button';
import { ScrollArea } from '@/presentation/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useEpub } from './hooks/useEpub';
import { EpubChapterList } from './components/EpubChapterList';

import { type Chapter, flattenToc as flattenChapters } from './utils/epubUtils';

interface EpubPreviewProps {
    file: File;
    onExtract: (text: string, chapters?: Chapter[], fullText?: string) => void;
    onCancel: () => void;
}

export function EpubPreview({ file, onExtract, onCancel }: EpubPreviewProps) {
    const { chapters, loading, isExtracting, extract } = useEpub(file);
    const [selectedHrefs, setSelectedHrefs] = useState<Set<string>>(new Set());

    const toggleChapter = (href: string) => {
        const newSelected = new Set(selectedHrefs);
        if (newSelected.has(href)) {
            newSelected.delete(href);
        } else {
            newSelected.add(href);
        }
        setSelectedHrefs(newSelected);
    };

    const handleExtract = async () => {
        try {
            // Extract selected chapters for immediate reading
            const selectedText = await extract(selectedHrefs);
            // Extract ALL chapters for storage (so user can switch chapters later)
            const allHrefs = new Set(flattenChapters(chapters).map(c => c.href));
            const fullText = await extract(allHrefs);
            onExtract(selectedText, chapters, fullText);
        } catch (error) {
            console.error('Extraction failed:', error);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{file.name}</h3>
                <div className="flex gap-2">
                    <Button onClick={handleExtract} disabled={selectedHrefs.size === 0 || isExtracting}>
                        {isExtracting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                        Import Selected ({selectedHrefs.size})
                    </Button>
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                </div>
            </div>

            <ScrollArea className="flex-1 border rounded-md p-4 bg-muted/20">
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>
                ) : (
                    <div className="space-y-1">
                        <EpubChapterList
                            chapters={chapters}
                            selectedHrefs={selectedHrefs}
                            onToggle={toggleChapter}
                        />
                        {chapters.length === 0 && <div className="text-center text-muted-foreground p-4">No chapters found for this EPUB.</div>}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};
