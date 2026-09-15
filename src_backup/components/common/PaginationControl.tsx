import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';

export interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange?: (page: number) => void;
  goToPage?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  setPageSize?: (size: number) => void;
  isLoading?: boolean;
  pageSizeOptions?: number[];
}

export const PaginationControl: React.FC<PaginationControlProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  goToPage,
  onPageSizeChange,
  setPageSize,
  isLoading = false,
  pageSizeOptions = [5, 10, 15, 20, 25, 50, 100],
}) => {
  const handlePageChange = (page: number) => {
    if (onPageChange) onPageChange(page);
    else if (goToPage) goToPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    if (onPageSizeChange) onPageSizeChange(size);
    else if (setPageSize) setPageSize(size);
  };
  // Generate page numbers with ellipsis handling
  const generatePageNumbers = (): (number | 'ellipsis')[] => {
    const delta = 1; // Number of pages to show before and after current page
    const range: number[] = [];
    const rangeWithDots: (number | 'ellipsis')[] = [];

    range.push(1);
    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i < totalPages && i > 1) {
        range.push(i);
      }
    }
    if (totalPages > 1) {
      range.push(totalPages);
    }

    let l: number | undefined;
    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('ellipsis');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const pages = generatePageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
      {/* Records Info & Page Size Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Hiển thị{' '}
          <strong className="font-mono text-slate-900 dark:text-white">
            {startIndex}
          </strong>{' '}
          -{' '}
          <strong className="font-mono text-slate-900 dark:text-white">
            {endIndex}
          </strong>{' '}
          trên tổng số{' '}
          <strong className="font-mono text-slate-900 dark:text-white">
            {totalItems}
          </strong>{' '}
          bản ghi
        </span>

        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
          <span>Số dòng:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            disabled={isLoading}
            className="h-7.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / trang
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pagination Navigation Buttons */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || isLoading || totalPages === 0}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          title="Về trang đầu"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading || totalPages === 0}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1 px-2.5"
          title="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Trước</span>
        </button>

        {/* Page Numbers with Ellipsis */}
        <div className="flex items-center gap-1 px-1">
          {pages.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                  <MoreHorizontal className="w-4 h-4 inline" />
                </span>
              );
            }
            const isSelected = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePageChange(p)}
                disabled={isLoading}
                className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                } disabled:opacity-50`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading || totalPages === 0}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1 px-2.5"
          title="Trang sau"
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage >= totalPages || isLoading || totalPages === 0}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          title="Đến trang cuối"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
