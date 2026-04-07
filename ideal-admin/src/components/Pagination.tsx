import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  className?: string;
};

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onLimitChange,
  className = '',
}: PaginationProps) {
  const limitOptions = [5, 10, 15, 20];

  // Show simple info on very small screens when no pagination needed
  if (totalPages <= 1 && totalItems <= itemsPerPage) {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 text-sm ${className}`}>
        <p className="text-muted-foreground">
          <span className="sm:hidden">Total: {totalItems}</span>
          <span className="hidden sm:inline">
            Showing {Math.min(itemsPerPage, totalItems)} of {totalItems}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs hidden sm:inline">
            Per page:
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onLimitChange(Number(value))}>
            <SelectTrigger className="h-8 w-16 text-xs cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {limitOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 1;

    pages.push(1);

    if (currentPage > delta + 2) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - delta - 1) {
      pages.push('...');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div
      className={`flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-between text-sm ${className}`}>
      {/* Left: Items info */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-muted-foreground">
        <p className="whitespace-nowrap">
          <span className="sm:hidden">
            {startItem}–{endItem} of {totalItems}
          </span>
          <span className="hidden sm:inline">
            Showing <strong>{startItem}</strong> to <strong>{endItem}</strong>{' '}
            of <strong>{totalItems}</strong> items
          </span>
        </p>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
        {/* Items per page */}
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-xs hidden sm:inline">
            Per page:
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onLimitChange(Number(value))}>
            <SelectTrigger className="h-8 w-14 sm:w-16 text-xs font-medium cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {limitOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pagination buttons */}
        <nav className="flex items-center gap-1" aria-label="Pagination">
          {/* First Page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
            aria-label="First page">
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
            aria-label="Previous page">
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Numbers (Desktop) */}
          <div className="hidden sm:flex items-center gap-1">
            {getPageNumbers().map((page, index) =>
              page === '...' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1 text-muted-foreground select-none">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page as number)}
                  className={`min-w-8 px-2 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    currentPage === page
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-gray-300 hover:bg-gray-50 text-foreground'
                  }`}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}>
                  {page}
                </button>
              ),
            )}
          </div>

          {/* Mobile: Current / Total */}
          <div className="flex sm:hidden items-center px-2 py-1 text-xs font-medium">
            {currentPage} / {totalPages}
          </div>

          {/* Next */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
            aria-label="Next page">
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
            aria-label="Last page">
            <ChevronsRight className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </div>
  );
}
