import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

export const FilterBar = ({
  children,
  onReset,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 mb-6 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3 flex-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
          <Filter size={14} />
          <span>Filters:</span>
        </div>
        {children}
      </div>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
        >
          <RotateCcw size={13} />
          Reset
        </button>
      )}
    </div>
  );
};

export default FilterBar;
