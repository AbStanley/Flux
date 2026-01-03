import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/presentation/components/ui/button';
import { ScrollArea } from '@/presentation/components/ui/scroll-area';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import { Card } from '@/presentation/components/ui/card';
import { Loader2 } from 'lucide-react';

// Configure the worker - crucial for Vite
// Using unpkg for the worker to avoid build hassles with copying worker files in some Vite setups,
// or we can use the relative import if configured correctly.
// For simplicity in a drop-in component, strictly following react-pdf 9.x+ guidance for Vite.
// We'll try the import way first. 
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Fix for worker - using CDN for reliability across environments
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfPreviewProps {
    file: File;
    onExtract: (text: string) => void;
    onCancel: () => void;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({ file, onExtract, onCancel }) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
    const [isExtracting, setIsExtracting] = useState(false);
    const [loading, setLoading] = useState(true);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setLoading(false);
        // Auto-select first page by default? No, let user choose.
    }

    const togglePage = (pageIndex: number) => {
        const newSelected = new Set(selectedPages);
        if (newSelected.has(pageIndex)) {
            newSelected.delete(pageIndex);
        } else {
            newSelected.add(pageIndex);
        }
        setSelectedPages(newSelected);
    };

    const selectAll = () => {
        if (selectedPages.size === numPages) {
            setSelectedPages(new Set());
        } else {
            const all = new Set<number>();
            for (let i = 1; i <= numPages; i++) all.add(i);
            setSelectedPages(all);
        }
    };

    const handleExtract = async () => {
        if (selectedPages.size === 0) return;
        setIsExtracting(true);

        try {
            const buffer = await file.arrayBuffer();
            const pdf = await pdfjs.getDocument(buffer).promise;

            let fullText = '';
            // Process pages in order
            const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);

            for (const pageNum of sortedPages) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(' ');

                if (!pageText.trim()) {
                    console.warn(`Page ${pageNum} text is empty.`);
                }

                fullText += `--- Page ${pageNum} ---\n\n${pageText}\n\n`;
            }

            console.log(`Extracted ${fullText.length} characters from PDF.`);
            onExtract(fullText);
        } catch (error) {
            console.error('Failed to extract text from PDF', error);
            // You might want to show an error toast here
        } finally {
            setIsExtracting(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{file.name}</h3>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={selectAll} disabled={loading}>
                        {selectedPages.size === numPages ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button onClick={handleExtract} disabled={selectedPages.size === 0 || isExtracting}>
                        {isExtracting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                        Import Selected ({selectedPages.size})
                    </Button>
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                </div>
            </div>

            <ScrollArea className="flex-1 border rounded-md p-4 bg-muted/20">
                <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>}
                    error={<div className="p-4 text-red-500">Failed to load PDF. Please try another file.</div>}
                    className="flex flex-col items-center gap-4"
                >
                    {Array.from(new Array(numPages), (_, index) => {
                        const pageNumber = index + 1;
                        const isSelected = selectedPages.has(pageNumber);

                        return (
                            <div key={pageNumber} className="relative group">
                                <Card
                                    className={`p-2 transition-all cursor-pointer ${isSelected ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-primary/50'}`}
                                    onClick={() => togglePage(pageNumber)}
                                >
                                    {/* We render a smaller width for preview performance */}
                                    <Page
                                        pageNumber={pageNumber}
                                        width={200}
                                        renderAnnotationLayer={false}
                                        renderTextLayer={false}
                                        className="shadow-sm"
                                    />
                                    <div className="absolute top-4 right-4 z-10">
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => togglePage(pageNumber)}
                                        />
                                    </div>
                                    <div className="text-center mt-2 text-sm text-muted-foreground">Page {pageNumber}</div>
                                </Card>
                            </div>
                        );
                    })}
                </Document>
            </ScrollArea>
        </div>
    );
};
