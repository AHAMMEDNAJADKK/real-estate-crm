import { useState, useMemo } from 'react';

export const usePagination = (totalItems, initialPage = 1, initialLimit = 10) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialLimit);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const goToNextPage = () => {
    if (canNext) setCurrentPage((prev) => prev + 1);
  };

  const goToPrevPage = () => {
    if (canPrev) setCurrentPage((prev) => prev - 1);
  };

  const setPage = (page) => {
    const p = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(p);
  };

  return {
    currentPage,
    pageSize,
    totalPages,
    canPrev,
    canNext,
    setPage,
    goToNextPage,
    goToPrevPage,
    setPageSize
  };
};

export default usePagination;
