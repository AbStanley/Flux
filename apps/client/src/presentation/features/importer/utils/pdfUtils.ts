import { pdfjs } from 'react-pdf';

// Ensure worker is set up in the main component or globally, but imports here form dependencies
// referencing types if needed, though pdfjs types are often loose.

export const extractPdfText = async (file: File, selectedPages: Set<number>): Promise<string> => {
    if (selectedPages.size === 0) return '';

    try {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument(buffer).promise;
        let fullText = '';

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
        return fullText;
    } catch (error) {
        console.error('Failed to extract text from PDF', error);
        throw error;
    }
};
