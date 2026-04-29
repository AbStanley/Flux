import { Search } from 'lucide-react';

interface WordListEmptyStateProps {
    message: string;
}

export function WordListEmptyState({ message }: WordListEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 w-full animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 shadow-inner">
                <Search className="w-10 h-10 text-primary/20" />
            </div>
            <div className="space-y-2 max-w-md px-4">
                <h3 className="font-bold text-xl text-foreground tracking-tight">Nothing found</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    {message}
                </p>
            </div>
            <div className="pt-2">
                <p className="text-xs text-muted-foreground/60 italic">
                    Try adjusting your filters or search query.
                </p>
            </div>
        </div>
    );
}
