import { useState, useEffect } from 'react';
import { wordsApi, type Word } from '@/infrastructure/api/words';
import { exportToCSV, exportToAnki } from '../utils/exportUtils';

export function useExport(isOpen: boolean, onClose: () => void) {
    const [lastExportDate, setLastExportDate] = useState<Date | null>(() => {
        const storedTime = localStorage.getItem('flux_last_export_time');
        return storedTime ? new Date(storedTime) : null;
    });
    const [range, setRange] = useState<'all' | 'since_last' | 'date_range'>(() => {
        const storedTime = localStorage.getItem('flux_last_export_time');
        return storedTime ? 'since_last' : 'all';
    });
    const [format, setFormat] = useState<'csv' | 'anki'>('csv');
    const [exportType, setExportType] = useState<'all' | 'word' | 'phrase'>('all');
    const [srcLang, setSrcLang] = useState<string>('all');
    const [tgtLang, setTgtLang] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    
    const [allItems, setAllItems] = useState<Word[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    useEffect(() => {
        if (isOpen) {
            Promise.resolve().then(() => setIsLoadingData(true));
            Promise.all([
                wordsApi.getAll({ limit: 10000, type: 'word' }),
                wordsApi.getAll({ limit: 10000, type: 'phrase' })
            ]).then(([wordsRes, phrasesRes]) => {
                setAllItems([...wordsRes.items, ...phrasesRes.items]);
                setIsLoadingData(false);
            }).catch(err => {
                console.error('Failed to load items for export counts', err);
                setIsLoadingData(false);
            });
        }
    }, [isOpen]);

    const getFilteredItems = () => {
        let items = allItems;

        if (exportType === 'word') {
            items = items.filter(i => i.type === 'word' || !i.type);
        } else if (exportType === 'phrase') {
            items = items.filter(i => i.type === 'phrase');
        }

        if (srcLang !== 'all') {
            items = items.filter(i => i.sourceLanguage === srcLang);
        }
        if (tgtLang !== 'all') {
            items = items.filter(i => i.targetLanguage === tgtLang);
        }

        if (range === 'since_last' && lastExportDate) {
            items = items.filter(i => new Date(i.createdAt) > lastExportDate);
        } else if (range === 'date_range') {
            if (startDate) {
                items = items.filter(i => new Date(i.createdAt) >= new Date(startDate));
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                items = items.filter(i => new Date(i.createdAt) <= end);
            }
        }

        return items;
    };

    const targetItems = getFilteredItems();

    const handleExecuteExport = () => {
        if (targetItems.length === 0) return;

        if (format === 'csv') {
            exportToCSV(targetItems);
        } else {
            exportToAnki(targetItems);
        }

        const now = new Date().toISOString();
        localStorage.setItem('flux_last_export_time', now);
        setLastExportDate(new Date(now));
        onClose();
    };

    return {
        format, setFormat,
        range, setRange,
        exportType, setExportType,
        srcLang, setSrcLang,
        tgtLang, setTgtLang,
        startDate, setStartDate,
        endDate, setEndDate,
        allItems,
        isLoadingData,
        lastExportDate,
        targetItems,
        handleExecuteExport
    };
}
