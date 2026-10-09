import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

export const FilterBar = ({
  children,
  onReset,
  className = ''
}) => {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 p-4 bg-[#1E2B40] rounded-2xl border border-[#334155] mb-6 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3 flex-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#94A3B8] uppercase tracking-wider mr-1">
          <Filter size={14} />
          <span>Filters:</span>
        </div>
        {children}
      </div>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] bg-[#243249] rounded-xl border border-[#334155] hover:bg-[#334155] transition-colors cursor-pointer"
        >
          <RotateCcw size={13} />
          Reset
        </button>
      )}
    </div>
  );
};

export default FilterBar;
