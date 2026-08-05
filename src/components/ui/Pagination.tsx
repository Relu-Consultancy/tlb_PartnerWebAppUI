import React from 'react';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    /** Pass both to show a "Show: N" entries-per-page selector. Omit to keep the old fixed-size behavior. */
    onItemsPerPageChange?: (n: number) => void;
    itemsPerPageOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions = [5, 10, 25, 50],
}) => {
    if (totalItems === 0 || (totalPages <= 1 && !onItemsPerPageChange)) return null;

    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-white px-5 py-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500 font-medium">
                    Showing {startItem} to {endItem} of {totalItems} entries
                </span>
                {onItemsPerPageChange && (
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        Show
                        <select
                            value={itemsPerPage}
                            onChange={e => onItemsPerPageChange(Number(e.target.value))}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-tlb-yellow/40"
                        >
                            {itemsPerPageOptions.map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </label>
                )}
            </div>
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
