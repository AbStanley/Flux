import { type Word } from "../../../../infrastructure/api/words";

export const exportToCSV = (words: Word[]) => {
    const headers = [
        'Text', 
        'Definition', 
        'Context', 
        'Source Language', 
        'Target Language', 
        'Source Title', 
        'Image URL', 
        'Pronunciation', 
        'Example 1', 
        'Example 1 Translation',
        'Example 2', 
        'Example 2 Translation',
        'Example 3', 
        'Example 3 Translation'
    ];
    const rows = words.map(word => {
        const ex1 = word.examples?.[0]?.sentence || '';
        const ex1Trans = word.examples?.[0]?.translation || '';
        const ex2 = word.examples?.[1]?.sentence || '';
        const ex2Trans = word.examples?.[1]?.translation || '';
        const ex3 = word.examples?.[2]?.sentence || '';
        const ex3Trans = word.examples?.[2]?.translation || '';

        return [
            word.text,
            word.definition,
            word.context,
            word.sourceLanguage,
            word.targetLanguage,
            word.sourceTitle,
            word.imageUrl,
            word.pronunciation,
            ex1,
            ex1Trans,
            ex2,
            ex2Trans,
            ex3,
            ex3Trans
        ].map(field => `"${(field || '').toString().replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(csvContent, 'words_export.csv', 'text/csv');
};

export const exportToAnki = (words: Word[]) => {
    // Format: Front | Back (Definition) | Example 1 | Example 1 Trans | Example 2 | Example 2 Trans | Example 3 | Example 3 Trans | Image | Tags
    const rows = words.map(word => {
        const front = word.text;

        let back = `<b>${word.definition || ''}</b><br>`;
        if (word.pronunciation) back += `/${word.pronunciation}/<br>`;
        if (word.context) back += `<i>Context: ${word.context}</i><br>`;
        if (word.sourceTitle) back += `<small>Source: ${word.sourceTitle}</small>`;

        const ex1 = word.examples?.[0]?.sentence || '';
        const ex1Trans = word.examples?.[0]?.translation || '';
        const ex2 = word.examples?.[1]?.sentence || '';
        const ex2Trans = word.examples?.[1]?.translation || '';
        const ex3 = word.examples?.[2]?.sentence || '';
        const ex3Trans = word.examples?.[2]?.translation || '';

        const clean = (str: string) => str.replace(/\n/g, '<br>').replace(/\t/g, '    ');

        const frontField = clean(front);
        const backField = clean(back);
        const imageField = word.imageUrl ? `<img src="${word.imageUrl}">` : '';

        // Tags
        const tags = [word.sourceLanguage, word.sourceTitle].filter(Boolean).map(t => t?.replace(/ /g, '_')).join(' ');

        return `${frontField}\t${backField}\t${clean(ex1)}\t${clean(ex1Trans)}\t${clean(ex2)}\t${clean(ex2Trans)}\t${clean(ex3)}\t${clean(ex3Trans)}\t${imageField}\t${tags}`;
    });

    const content = rows.join('\n');
    downloadFile(content, 'anki_import.txt', 'text/plain');
};

const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type: `${type};charset=utf-8;` });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
