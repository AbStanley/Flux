import React from 'react';

interface ReaderPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const ReaderPagination: React.FC<ReaderPaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange
}) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center items-center gap-4 py-6 mt-4 border-t border-border/40">
            <button
                className="px-4 py-2 text-sm font-medium transition-colors hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
            >
                Previous
            </button>
            <span className="text-sm text-muted-foreground font-mono">
                {currentPage} / {totalPages}
            </span>
            <button
                className="px-4 py-2 text-sm font-medium transition-colors hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
            >
                Next
            </button>
        </div>
    );
};
