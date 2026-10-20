import React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import EmptyState from './EmptyState';
import { Spinner } from './EmptyState';

export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  pagination,
  onPageChange,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  emptyTitle,
  emptyDescription,
  onEmptyAction,
  emptyActionLabel,
  filters
}) => {
  return (
    <div className="bg-white dark:bg-[#1E2B40] rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs overflow-hidden transition-colors duration-200">
      {/* Controls Bar */}
      {(onSearchChange || filters) && (
        <div className="p-4 border-b border-slate-200 dark:border-[#334155] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-[#1A2537]">
          {onSearchChange && (
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 dark:text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-[#243249] border border-slate-300 dark:border-[#334155] rounded-xl text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#6D28D9] focus:border-[#6D28D9] transition-all"
              />
            </div>
          )}
          {filters && <div className="flex items-center gap-2 flex-wrap">{filters}</div>}
        </div>
      )}

      {/* Table Body */}
      {loading ? (
        <div className="py-12 flex justify-center text-slate-700 dark:text-white">
          <Spinner size="lg" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-slate-800 dark:text-white py-6">
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            onAction={onEmptyAction}
            actionLabel={emptyActionLabel}
          />
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#334155] bg-slate-100/80 dark:bg-[#243249] text-slate-600 dark:text-[#94A3B8] text-xs font-bold uppercase tracking-wider">
                {columns.map((col, idx) => (
                  <th key={idx} className={`py-3.5 px-4 ${col.className || ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#334155] text-xs sm:text-sm text-slate-800 dark:text-[#F8FAFC]">
              {data.map((row, rowIdx) => (
                <tr key={row._id || row.id || rowIdx} className="hover:bg-slate-50/80 dark:hover:bg-[#243249]/50 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`py-3.5 px-4 ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-[#334155] flex items-center justify-between text-xs text-slate-600 dark:text-[#94A3B8] bg-slate-50 dark:bg-[#1A2537]">
          <div>
            Showing page <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{pagination.page}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{pagination.totalPages}</span> ({pagination.total} total records)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#243249] text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#334155] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-[#334155] bg-white dark:bg-[#243249] text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#334155] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
