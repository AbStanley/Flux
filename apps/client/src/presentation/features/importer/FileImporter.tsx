import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/presentation/components/ui/button';
import { Upload } from 'lucide-react';
import { PdfPreview } from './PdfPreview';
import { EpubPreview } from './EpubPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/presentation/components/ui/dialog';
import { useReaderStore } from '../reader/store/useReaderStore';

interface FileImporterProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const FileImporter: React.FC<FileImporterProps> = ({ open, onOpenChange }) => {
    const [file, setFile] = useState<File | null>(null);
    const { setText } = useReaderStore();

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

    const handleExtract = (text: string) => {
        setText(text);
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
                    border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
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
