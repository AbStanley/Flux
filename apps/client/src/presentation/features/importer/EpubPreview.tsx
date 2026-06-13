import { useState } from 'react';
import { Button } from '@/presentation/components/ui/button';
import { ScrollArea } from '@/presentation/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useEpub } from './hooks/useEpub';
import { EpubChapterList } from './components/EpubChapterList';
import { flattenToc, type Chapter } from './utils/epubUtils';

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
            // Extract ALL chapters in a single pass to prevent ePub.js blob revocation bugs
            const allHrefs = new Set(flattenToc(chapters).map(c => c.href));
            const fullText = await extract(allHrefs);

            // Derive selected text from the full text to ensure consistency
            let selectedText = '';
            if (fullText) {
                const parts = fullText.split(/^### /m);
                for (const part of parts) {
                    if (!part.trim()) continue;
                    const newlineIdx = part.indexOf('\n');
                    if (newlineIdx === -1) continue;
                    const label = part.slice(0, newlineIdx).trim();
                    const content = part.slice(newlineIdx).trim();
                    
                    // Check if this chapter's label matches any selected href's label
                    const isSelected = flattenToc(chapters).some(c => c.label.trim() === label && selectedHrefs.has(c.href));
                    if (isSelected) {
                        selectedText += `### ${label}\n\n${content}\n\n`;
                    }
                }
            }

            // Execute the extraction callback with full chapters and text
            onExtract(selectedText, chapters, fullText);
        } catch (error) {
            console.error('Extraction failed:', error);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <h3 className="text-lg font-semibold truncate" title={file.name}>{file.name}</h3>
            </div>

            <ScrollArea className="flex-1 border rounded-md p-4 bg-muted/20 overscroll-contain">
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

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <Button variant="ghost" className="w-full sm:w-auto" onClick={onCancel}>Cancel</Button>
                <Button className="w-full sm:w-auto" onClick={handleExtract} disabled={selectedHrefs.size === 0 || isExtracting}>
                    {isExtracting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                    Import Selected ({selectedHrefs.size})
                </Button>
            </div>
        </div>
    );
};
