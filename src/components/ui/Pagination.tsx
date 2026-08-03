import React from 'react';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange
}) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-white px-5 py-4 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-xs text-gray-500 font-medium">
                Showing {startItem} to {endItem} of {totalItems} entries
            </span>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                    Previous
                </button>
                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                    {currentPage} / {totalPages}
                </span>
                <button 
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                    Next
                </button>
            </div>
        </div>
    );
};
