import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/presentation/components/ui/button';
import { Upload } from 'lucide-react';
import { PdfPreview } from './PdfPreview';
import { EpubPreview } from './EpubPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/presentation/components/ui/dialog';
import { useReaderStore } from '../reader/store/useReaderStore';
import { readingSessionsApi, type ChapterInfo } from '@/infrastructure/api/reading-sessions';

interface FileImporterProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FileImporter({ open, onOpenChange }: FileImporterProps) {
    const [file, setFile] = useState<File | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/epub+zip': ['.epub'],
        },
        maxFiles: 1,
        multiple: false
    });

    const handleExtract = (text: string, chapters?: ChapterInfo[], fullText?: string) => {
        const store = useReaderStore.getState();
        const { sourceLang, targetLang, PAGE_SIZE } = store;

        const fileName = file?.name?.replace(/\.(pdf|epub)$/i, '') || 'Untitled';
        const fileType = file?.name?.endsWith('.epub') ? 'epub' : 'pdf';

        // For EPUBs, store fullText (all chapters) so user can switch chapters later.
        // For PDFs, store only selected pages — full PDFs are too large for the DB.
        const textToStore = fileType === 'epub' ? (fullText || text) : text;
        const storeTokens = textToStore.split(/(\s+)/);
        const totalPages = Math.ceil(storeTokens.length / PAGE_SIZE);

        store.setSession('_importing', fileName);
        store.loadText(text);

        // For PDFs, generate page entries from markers in the stored text
        const pdfChapters: ChapterInfo[] | undefined =
            fileType === 'pdf'
                ? [...textToStore.matchAll(/^--- Page (\d+) ---$/gm)].map(m => ({
                    label: `Page ${m[1]}`,
                    href: `page-${m[1]}`,
                }))
                : undefined;

        readingSessionsApi.create({
            title: fileName,
            text: textToStore,
            currentPage: 1,
            totalPages,
            sourceLang,
            targetLang,
            fileType,
            chapters: chapters || pdfChapters,
        }).then((session) => {
            const finalStore = useReaderStore.getState();
            finalStore.setSession(session.id, session.title);
            finalStore.setIsReading(true);
        }).catch((err) => {
            console.error('Failed to create session:', err);
            useReaderStore.getState().setSession(null, null);
        });

        setFile(null);
        onOpenChange(false);
    };

    const handleCancel = () => {
        setFile(null);
    };

    const renderContent = () => {
        if (!file) {
            return (
                <div
                    {...getRootProps()}
                    className={`
                    border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors h-full
                    ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'}
                `}
                >
                    <input {...getInputProps()} />
                    <div className="p-4 bg-muted rounded-full mb-4">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                        {isDragActive ? "Drop the file here" : "Drag & drop a file here"}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Support for PDF and EPUB files. Drop a file to preview and select content to import.
                    </p>
                    <Button variant="outline" className="mt-6 pointer-events-none">
                        Select File
                    </Button>
                </div>
            );
        }

        if (file.type === 'application/pdf') {
            return <PdfPreview file={file} onExtract={handleExtract} onCancel={handleCancel} />;
        }

        // EPUB mime type varies slightly but check extension or part of mime
        if (file.type === 'application/epub+zip' || file.name.endsWith('.epub')) {
            return <EpubPreview file={file} onExtract={handleExtract} onCancel={handleCancel} />;
        }

        return (
            <div className="text-center p-8">
                <p className="text-red-500">Unsupported file type.</p>
                <Button onClick={() => setFile(null)} className="mt-4">Try Again</Button>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-6">
                <DialogHeader>
                    <DialogTitle>Import Content from File</DialogTitle>
                    <DialogDescription>
                        Upload a PDF or EPUB file to extract text for reading.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                    {renderContent()}
                </div>
            </DialogContent>
        </Dialog>
    );
};
