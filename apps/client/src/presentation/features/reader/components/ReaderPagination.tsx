import { Slider } from '../../../components/ui/slider';

interface ReaderPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function ReaderPagination({
    currentPage,
    totalPages,
    onPageChange
}: ReaderPaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col gap-4 py-6 mt-4 border-t border-border/40">
            {/* Slider for rapid navigation */}
            <div className="flex items-center gap-4 px-2">
                <span className="text-[10px] font-medium text-muted-foreground w-8">Page 1</span>
                <Slider
                    value={[currentPage]}
                    min={1}
                    max={totalPages}
                    step={1}
                    onValueChange={([val]: number[]) => onPageChange(val)}
                    className="flex-1"
                />
                <span className="text-[10px] font-medium text-muted-foreground w-8 text-right">Page {totalPages}</span>
            </div>

            {/* Stepper controls */}
            <div className="flex justify-center items-center gap-6">
                <button
                    className="h-9 px-4 rounded-md border bg-background hover:bg-muted text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
                
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono bg-muted/50 px-3 py-1.5 rounded-md border shadow-inner min-w-[60px] text-center">
                        {currentPage} <span className="text-muted-foreground font-normal mx-1">/</span> {totalPages}
                    </span>
                </div>

                <button
                    className="h-9 px-4 rounded-md border bg-background hover:bg-muted text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

