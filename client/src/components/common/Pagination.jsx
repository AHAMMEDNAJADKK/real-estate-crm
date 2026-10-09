import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  pageSize = 10,
  totalItems = 0,
  className = ''
}) => {
  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-[#1E2B40] border-t border-[#334155] ${className}`}
    >
      <p className="text-xs text-[#94A3B8]">
        Showing{' '}
        <span className="font-semibold text-[#F8FAFC]">
          {(currentPage - 1) * pageSize + 1}
        </span>{' '}
        to{' '}
        <span className="font-semibold text-[#F8FAFC]">
          {Math.min(currentPage * pageSize, totalItems)}
        </span>{' '}
        of{' '}
        <span className="font-semibold text-[#F8FAFC]">
          {totalItems}
        </span>{' '}
        records
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-2 rounded-xl border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#243249] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#243249] text-[#F8FAFC] border border-[#334155]">
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-2 rounded-xl border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#243249] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
