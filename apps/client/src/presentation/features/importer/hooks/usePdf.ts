import { useState, useCallback } from 'react';
import { extractPdfText } from '../utils/pdfUtils';

export const usePdf = (file: File) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [isExtracting, setIsExtracting] = useState(false);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const extract = useCallback(async (selectedPages: Set<number>) => {
        if (selectedPages.size === 0) return '';

        setIsExtracting(true);
        try {
            return await extractPdfText(file, selectedPages);
        } finally {
            setIsExtracting(false);
        }
    }, [file]);

    return {
        numPages,
        isExtracting,
        onDocumentLoadSuccess,
        extract
    };
};
