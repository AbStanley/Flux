import { Slider } from '../../../components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="flex flex-col gap-2 py-1">
            {/* Slider for rapid navigation */}
            <div className="flex items-center gap-4 px-6 group">
                <span className="text-[10px] font-bold text-muted-foreground/50 tabular-nums">1</span>
                <div className="flex-1 py-2 relative">
                    <Slider
                        value={[currentPage]}
                        min={1}
                        max={totalPages}
                        step={1}
                        onValueChange={([val]: number[]) => onPageChange(val)}
                        className="cursor-pointer relative z-10"
                    />
                    {/* Animated background glow behind slider track */}
                    <div className="absolute inset-x-0 h-1 top-1/2 -translate-y-1/2 bg-primary/10 rounded-full blur-sm" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground/50 tabular-nums">{totalPages}</span>
            </div>

            {/* Stepper controls */}
            <div className="flex justify-center items-center gap-3">
                <button
                    className="h-8 px-4 rounded-xl border bg-background hover:bg-muted text-xs font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
                
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center text-xs font-black font-mono bg-primary/5 text-primary px-3 py-1.5 rounded-xl border-2 border-primary/20 shadow-inner min-w-[70px] overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={currentPage}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                            >
                                {currentPage}
                            </motion.span>
                        </AnimatePresence>
                        <span className="text-muted-foreground/40 font-normal mx-2">/</span> 
                        <span className="text-muted-foreground/60">{totalPages}</span>
                    </div>
                </div>

                <button
                    className="h-8 px-4 rounded-xl border bg-background hover:bg-muted text-xs font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

