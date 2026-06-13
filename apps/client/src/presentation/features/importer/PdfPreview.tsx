import { useState } from 'react';
import { Document, pdfjs } from 'react-pdf';
import { Button } from '@/presentation/components/ui/button';
import { ScrollArea } from '@/presentation/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { usePdf } from './hooks/usePdf';
import { PdfPageGrid } from './components/PdfPageGrid';

// Fix for worker - using CDN for reliability across environments
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfPreviewProps {
    file: File;
    onExtract: (text: string) => void;
    onCancel: () => void;
}

export function PdfPreview({ file, onExtract, onCancel }: PdfPreviewProps) {
    const { numPages, isExtracting, onDocumentLoadSuccess, extract } = usePdf(file);
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

    const togglePage = (pageIndex: number) => {
        const newSelected = new Set(selectedPages);
        if (newSelected.has(pageIndex)) {
            newSelected.delete(pageIndex);
        } else {
            newSelected.add(pageIndex);
        }
        setSelectedPages(newSelected);
    };

    const handleExtract = async () => {
        try {
            const text = await extract(selectedPages);
            onExtract(text);
        } catch (error) {
            console.error('Extraction failed:', error);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <h3 className="text-lg font-semibold truncate" title={file.name}>{file.name}</h3>
            </div>

            <ScrollArea className="flex-1 border rounded-md p-4 bg-muted/20">
                <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>}
                    error={<div className="p-4 text-red-500">Failed to load PDF. Please try another file.</div>}
                    className="flex flex-col items-center gap-4"
                >
                    <PdfPageGrid
                        numPages={numPages}
                        selectedPages={selectedPages}
                        onToggle={togglePage}
                    />
                </Document>
            </ScrollArea>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <Button variant="ghost" className="w-full sm:w-auto" onClick={onCancel}>Cancel</Button>
                <Button className="w-full sm:w-auto" onClick={handleExtract} disabled={selectedPages.size === 0 || isExtracting}>
                    {isExtracting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                    Import Selected ({selectedPages.size})
                </Button>
            </div>
        </div>
    );
};
