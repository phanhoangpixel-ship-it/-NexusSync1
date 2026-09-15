import { useState, useEffect, useCallback, useMemo } from 'react';

export interface UsePaginationOptions {
  defaultPage?: number;
  defaultPageSize?: number;
  totalItems: number;
  syncWithUrl?: boolean;
}

export interface UsePaginationReturn {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  paginatedData<T>(data: T[]): T[];
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  resetPagination: () => void;
}

export function usePagination({
  defaultPage = 1,
  defaultPageSize = 10,
  totalItems,
  syncWithUrl = true,
}: UsePaginationOptions): UsePaginationReturn {
  // Read initial values from URL search params if syncWithUrl is true
  const getInitialParams = () => {
    if (!syncWithUrl || typeof window === 'undefined') {
      return { page: defaultPage, pageSize: defaultPageSize };
    }
    const params = new URLSearchParams(window.location.search);
    const pageParam = parseInt(params.get('page') || '', 10);
    const sizeParam = parseInt(params.get('pageSize') || '', 10);

    const allowedSizes = [5, 10, 15, 20, 25, 50, 100];
    return {
      page: !isNaN(pageParam) && pageParam > 0 ? pageParam : defaultPage,
      pageSize: !isNaN(sizeParam) && (allowedSizes.includes(sizeParam) || sizeParam % 5 === 0) ? sizeParam : defaultPageSize,
    };
  };

  const initial = getInitialParams();
  const [currentPage, setCurrentPage] = useState<number>(initial.page);
  const [pageSize, setStatePageSize] = useState<number>(initial.pageSize);

  // Total pages calculation
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  // Ensure currentPage stays within valid bounds [1, totalPages]
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Sync state changes with URL query parameters
  useEffect(() => {
    if (!syncWithUrl || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (currentPage > 1) {
      url.searchParams.set('page', String(currentPage));
    } else {
      url.searchParams.delete('page');
    }
    if (pageSize !== 25) {
      url.searchParams.set('pageSize', String(pageSize));
    } else {
      url.searchParams.delete('pageSize');
    }
    window.history.replaceState({}, '', url.toString());
  }, [currentPage, pageSize, syncWithUrl]);

  const goToPage = useCallback((page: number) => {
    const target = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(target);
  }, [totalPages]);

  const setPageSize = useCallback((size: number) => {
    setStatePageSize(size);
    setCurrentPage(1); // Reset to page 1 on page size change
  }, []);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const lastPage = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Slice data for client-side pagination
  const paginatedData = useCallback(<T>(data: T[]): T[] => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [currentPage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  return {
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    paginatedData,
    goToPage,
    setPageSize,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    resetPagination,
  };
}
