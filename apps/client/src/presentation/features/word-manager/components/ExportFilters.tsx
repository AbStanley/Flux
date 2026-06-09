import { Label } from '@/presentation/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';

interface ExportFiltersProps {
    exportType: 'all' | 'word' | 'phrase';
    setExportType: (type: 'all' | 'word' | 'phrase') => void;
    srcLang: string;
    setSrcLang: (lang: string) => void;
    tgtLang: string;
    setTgtLang: (lang: string) => void;
    uniqueSourceLangs: string[];
    uniqueTargetLangs: string[];
}

export function ExportFilters({
    exportType,
    setExportType,
    srcLang,
    setSrcLang,
    tgtLang,
    setTgtLang,
    uniqueSourceLangs,
    uniqueTargetLangs
}: ExportFiltersProps) {
    return (
        <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={exportType} onValueChange={(val) => setExportType(val as 'all' | 'word' | 'phrase')}>
                    <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="word">Words</SelectItem>
                        <SelectItem value="phrase">Phrases</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1">
                <Label className="text-xs">Source Lang</Label>
                <Select value={srcLang} onValueChange={setSrcLang}>
                    <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {uniqueSourceLangs.map(lang => (
                            <SelectItem key={`src-${lang}`} value={lang}>{lang}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1">
                <Label className="text-xs">Target Lang</Label>
                <Select value={tgtLang} onValueChange={setTgtLang}>
                    <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {uniqueTargetLangs.map(lang => (
                            <SelectItem key={`tgt-${lang}`} value={lang}>{lang}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
