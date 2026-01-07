import React from 'react';
import { Page } from 'react-pdf';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import { Card } from '@/presentation/components/ui/card';

interface PdfPageGridProps {
    numPages: number;
    selectedPages: Set<number>;
    onToggle: (pageNumber: number) => void;
}

export const PdfPageGrid: React.FC<PdfPageGridProps> = ({ numPages, selectedPages, onToggle }) => {
    return (
        <>
            {Array.from(new Array(numPages), (_, index) => {
                const pageNumber = index + 1;
                const isSelected = selectedPages.has(pageNumber);

                return (
                    <div key={pageNumber} className="relative group">
                        <Card
                            className={`p-2 transition-all cursor-pointer ${isSelected ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-primary/50'}`}
                            onClick={() => onToggle(pageNumber)}
                        >
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
                                    onCheckedChange={() => onToggle(pageNumber)}
                                />
                            </div>
                            <div className="text-center mt-2 text-sm text-muted-foreground">Page {pageNumber}</div>
                        </Card>
                    </div>
                );
            })}
        </>
    );
};
