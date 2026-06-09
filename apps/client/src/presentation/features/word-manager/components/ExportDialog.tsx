import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { useExport } from '../hooks/useExport';
import { ExportFilters } from './ExportFilters';
import { Download, FileSpreadsheet, History, Loader2, Calendar } from 'lucide-react';

interface ExportDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
    const {
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
    } = useExport(isOpen, onClose);

    const uniqueSourceLangs = Array.from(new Set(allItems.map(l => l.sourceLanguage).filter(Boolean))) as string[];
    const uniqueTargetLangs = Array.from(new Set(allItems.map(l => l.targetLanguage).filter(Boolean))) as string[];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md w-full border bg-card text-card-foreground shadow-2xl rounded-2xl p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold tracking-tight">Export Vocabulary</DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm">
                        Select a format and range to export your collected words.
                    </DialogDescription>
                </DialogHeader>

                {isLoadingData ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Analyzing vocabulary collection...</span>
                    </div>
                ) : (
                    <div className="space-y-5 my-2">
                        {/* Format Selection */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Format</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormat('csv')}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                                        format === 'csv'
                                            ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                                            : 'border-muted hover:bg-muted/40 text-muted-foreground'
                                    }`}
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                    CSV Spreadsheets
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormat('anki')}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                                        format === 'anki'
                                            ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                                            : 'border-muted hover:bg-muted/40 text-muted-foreground'
                                    }`}
                                >
                                    <Download className="h-4 w-4" />
                                    Anki Flashcards
                                </button>
                            </div>
                        </div>

                        {/* Range Selection */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Export Range</Label>
                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRange('all')}
                                    className={`flex items-center justify-between p-3 rounded-xl border text-sm transition-all text-left ${
                                        range === 'all' ? 'border-primary bg-primary/5 text-foreground' : 'border-muted hover:bg-muted/30 text-muted-foreground'
                                    }`}
                                >
                                    <span>Export All ({allItems.length} items)</span>
                                </button>

                                {lastExportDate && (
                                    <button
                                        type="button"
                                        onClick={() => setRange('since_last')}
                                        className={`flex items-center justify-between p-3 rounded-xl border text-sm transition-all text-left ${
                                            range === 'since_last' ? 'border-primary bg-primary/5 text-foreground' : 'border-muted hover:bg-muted/30 text-muted-foreground'
                                        }`}
                                    >
                                        <div className="space-y-0.5">
                                            <div className="font-medium flex items-center gap-1.5">
                                                <History className="h-3.5 w-3.5" />
                                                Since Last Export
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Last run: {lastExportDate.toLocaleDateString()} {lastExportDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                                            {allItems.filter(i => new Date(i.createdAt) > lastExportDate).length} new
                                        </span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setRange('date_range')}
                                    className={`flex items-center justify-between p-3 rounded-xl border text-sm transition-all text-left ${
                                        range === 'date_range' ? 'border-primary bg-primary/5 text-foreground' : 'border-muted hover:bg-muted/30 text-muted-foreground'
                                    }`}
                                >
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Custom Date Range
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Date Inputs if Custom Date Range selected */}
                        {range === 'date_range' && (
                            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 border rounded-xl animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-1">
                                    <Label className="text-xs">Start Date</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="h-9 text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">End Date</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="h-9 text-xs"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Filters */}
                        <ExportFilters
                            exportType={exportType}
                            setExportType={setExportType}
                            srcLang={srcLang}
                            setSrcLang={setSrcLang}
                            tgtLang={tgtLang}
                            setTgtLang={setTgtLang}
                            uniqueSourceLangs={uniqueSourceLangs}
                            uniqueTargetLangs={uniqueTargetLangs}
                        />

                        {/* Summary Message */}
                        <div className="p-3.5 bg-muted/40 rounded-xl text-xs flex justify-between items-center border">
                            <span className="text-muted-foreground">Items selected for export:</span>
                            <span className="font-bold text-foreground text-sm">
                                {targetItems.length} {targetItems.length === 1 ? 'item' : 'items'}
                            </span>
                        </div>
                    </div>
                )}

                <DialogFooter className="mt-6 flex gap-2">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExecuteExport}
                        disabled={targetItems.length === 0 || isLoadingData}
                        className="flex-1 shadow-lg shadow-primary/20"
                    >
                        Export File
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
